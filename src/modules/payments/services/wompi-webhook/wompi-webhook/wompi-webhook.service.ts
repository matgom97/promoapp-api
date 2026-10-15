import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import {
  createHash,
  timingSafeEqual,
} from 'node:crypto';

import { PrismaService } from '../../../../../database/prisma/prisma.service.js';

interface WompiWebhookSignature {
  properties: string[];
  checksum: string;
}

interface WompiTransaction {
  id: string;
  reference: string;
  amount_in_cents: number;
  currency: string;
  status: string;
}

interface WompiTransactionUpdatedEvent {
  event: string;

  data: {
    transaction: WompiTransaction;
  };

  environment: 'test' | 'prod';

  signature: WompiWebhookSignature;

  timestamp: number;

  sent_at?: string;
}

type PaymentStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DECLINED'
  | 'VOIDED'
  | 'ERROR';

@Injectable()
export class WompiWebhookService {
  private readonly eventsSecret: string;
  private readonly nodeEnvironment: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.eventsSecret =
      this.configService.getOrThrow<string>(
        'WOMPI_EVENTS_SECRET',
      );

    this.nodeEnvironment =
      this.configService.getOrThrow<string>(
        'NODE_ENV',
      );
  }

  // ==========================================
  // PROCESS WEBHOOK
  // ==========================================

  async processTransactionUpdated(
    event: WompiTransactionUpdatedEvent,
    headerChecksum?: string,
  ) {
    /*
     * 1. Validamos el evento esperado.
     */

    if (event.event !== 'transaction.updated') {
      return {
        processed: false,
        message: 'Event ignored',
      };
    }

    /*
     * 2. Validamos la estructura del evento.
     */

    const transaction = event.data?.transaction;

    if (!transaction) {
      throw new BadRequestException(
        'Wompi transaction data is missing',
      );
    }

    if (
      !event.signature ||
      !Array.isArray(event.signature.properties) ||
      event.signature.properties.length === 0 ||
      !event.signature.checksum
    ) {
      throw new BadRequestException(
        'Wompi event signature is missing',
      );
    }

    if (
      !event.timestamp ||
      !Number.isInteger(event.timestamp)
    ) {
      throw new BadRequestException(
        'Wompi event timestamp is invalid',
      );
    }

    /*
     * 3. Validamos el entorno.
     */

    this.validateEnvironment(event.environment);

    /*
     * 4. Validamos el checksum de Wompi.
     */

    this.validateChecksum(event, headerChecksum);

    /*
     * 5. Buscamos el pago por ID de transacción.
     * Si no existe, buscamos por referencia.
     */

    let payment =
      await this.prisma.payment.findUnique({
        where: {
          providerTransactionId: transaction.id,
        },
        include: {
          subscription: {
            include: {
              plan: true,
            },
          },
        },
      });

    if (!payment) {
      payment =
        await this.prisma.payment.findUnique({
          where: {
            reference: transaction.reference,
          },
          include: {
            subscription: {
              include: {
                plan: true,
              },
            },
          },
        });
    }

    /*
     * 6. Verificamos que exista el pago.
     */

    if (!payment) {
      throw new BadRequestException(
        'Payment not found for Wompi transaction',
      );
    }

    /*
     * 7. Validamos la referencia.
     */

    if (transaction.reference !== payment.reference) {
      throw new BadRequestException(
        'Wompi transaction reference does not match payment',
      );
    }

    /*
     * 8. Validamos el monto.
     *
     * La base de datos almacena pesos COP.
     * Wompi utiliza centavos.
     */

    const expectedAmountInCents = payment.amount * 100n;

    const receivedAmountInCents = BigInt(
      transaction.amount_in_cents,
    );

    if (
      receivedAmountInCents !== expectedAmountInCents
    ) {
      throw new BadRequestException(
        'Wompi transaction amount does not match payment',
      );
    }

    /*
     * 9. Validamos la moneda.
     */

    if (transaction.currency !== payment.currency) {
      throw new BadRequestException(
        'Wompi transaction currency does not match payment',
      );
    }

    /*
     * 10. Convertimos el estado de Wompi.
     */

    const paymentStatus = this.mapPaymentStatus(
      transaction.status,
    );

    /*
     * 11. Actualizamos el pago y la suscripción
     * dentro de una transacción.
     */

    const result = await this.prisma.$transaction(
      async (tx) => {
        const currentPayment =
          await tx.payment.findUnique({
            where: {
              id: payment!.id,
            },
            include: {
              subscription: true,
            },
          });

        if (!currentPayment) {
          throw new BadRequestException(
            'Payment no longer exists',
          );
        }

        /*
         * 12. Protección contra estados finales.
         *
         * Si el pago ya está aprobado y la suscripción
         * no tiene fecha de vencimiento, completamos
         * la fecha sin volver a procesar el pago.
         */

        if (
          this.isFinalPaymentStatus(
            currentPayment.status,
          )
        ) {
          if (
            currentPayment.status === 'APPROVED' &&
            paymentStatus === 'APPROVED' &&
            !currentPayment.subscription.currentPeriodEnd
          ) {
            const now = new Date();

            const periodEnd = new Date(now);

            periodEnd.setMonth(
              periodEnd.getMonth() + 1,
            );

            const updatedSubscription =
              await tx.subscription.update({
                where: {
                  id: currentPayment.subscriptionId,
                },
                data: {
                  status: 'ACTIVE',

                  currentPeriodStart:
                    currentPayment.subscription
                      .currentPeriodStart ?? now,

                  currentPeriodEnd: periodEnd,
                },
              });

            return {
              payment: currentPayment,
              subscription: updatedSubscription,
              alreadyProcessed: true,
            };
          }

          /*
           * No modificamos pagos que ya alcanzaron
           * un estado final.
           */

          return {
            payment: currentPayment,
            subscription: currentPayment.subscription,
            alreadyProcessed: true,
          };
        }

        /*
         * 13. Si el estado no cambió, evitamos
         * procesar nuevamente el evento.
         */

        if (currentPayment.status === paymentStatus) {
          return {
            payment: currentPayment,
            subscription: currentPayment.subscription,
            alreadyProcessed: true,
          };
        }

        /*
         * 14. Actualizamos el pago.
         */

        const updatedPayment =
          await tx.payment.update({
            where: {
              id: currentPayment.id,
            },
            data: {
              status: paymentStatus,

              providerTransactionId: transaction.id,

              paidAt:
                paymentStatus === 'APPROVED'
                  ? new Date()
                  : null,
            },
          });

        /*
         * 15. Por defecto conservamos la suscripción.
         */

        let updatedSubscription =
          currentPayment.subscription;

        /*
         * 16. Si Wompi aprobó el pago, activamos
         * la suscripción y asignamos sus fechas.
         */

        if (paymentStatus === 'APPROVED') {
          const now = new Date();

          const periodEnd = new Date(now);

          periodEnd.setMonth(
            periodEnd.getMonth() + 1,
          );

          updatedSubscription =
            await tx.subscription.update({
              where: {
                id: currentPayment.subscriptionId,
              },
              data: {
                status: 'ACTIVE',
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
              },
            });
        }

        return {
          payment: updatedPayment,
          subscription: updatedSubscription,
          alreadyProcessed: false,
        };
      },
    );

    /*
     * 17. Respuesta final.
     */

    return {
      processed: true,

      alreadyProcessed: result.alreadyProcessed,

      paymentId: result.payment.id,

      subscriptionId: result.subscription.id,

      paymentStatus: result.payment.status,

      subscriptionStatus: result.subscription.status,
    };
  }

  // ==========================================
  // ENVIRONMENT
  // ==========================================

  private validateEnvironment(
    wompiEnvironment: 'test' | 'prod',
  ): void {
    const expectedEnvironment =
      this.nodeEnvironment === 'production'
        ? 'prod'
        : 'test';

    if (wompiEnvironment !== expectedEnvironment) {
      throw new UnauthorizedException(
        'Wompi event environment does not match application environment',
      );
    }
  }

  // ==========================================
  // CHECKSUM
  // ==========================================

  private validateChecksum(
    event: WompiTransactionUpdatedEvent,
    headerChecksum?: string,
  ): void {
    const properties = event.signature.properties;

    const values = properties.map((property) =>
      this.getPropertyValue(event.data, property),
    );

    const payload =
      `${values.join('')}${event.timestamp}${this.eventsSecret}`;

    const calculatedChecksum = createHash('sha256')
      .update(payload)
      .digest('hex');

    const receivedChecksum = (
      headerChecksum || event.signature.checksum
    ).trim();

    if (!receivedChecksum) {
      throw new UnauthorizedException(
        'Wompi event checksum is missing',
      );
    }

    const isValid = this.safeCompare(
      calculatedChecksum,
      receivedChecksum,
    );

    if (!isValid) {
      throw new UnauthorizedException(
        'Invalid Wompi event checksum',
      );
    }
  }

  // ==========================================
  // PROPERTY RESOLVER
  // ==========================================

  private getPropertyValue(
    data: unknown,
    property: string,
  ): string {
    const parts = property.split('.');

    let current: unknown = data;

    for (const part of parts) {
      if (
        current === null ||
        typeof current !== 'object'
      ) {
        throw new BadRequestException(
          `Wompi signature property "${property}" could not be resolved`,
        );
      }

      const record = current as Record<string, unknown>;

      if (!(part in record)) {
        throw new BadRequestException(
          `Wompi signature property "${property}" does not exist`,
        );
      }

      current = record[part];
    }

    if (
      current === null ||
      current === undefined
    ) {
      throw new BadRequestException(
        `Wompi signature property "${property}" is empty`,
      );
    }

    return String(current);
  }

  // ==========================================
  // SAFE CHECKSUM COMPARISON
  // ==========================================

  private safeCompare(
    expected: string,
    received: string,
  ): boolean {
    const expectedBuffer = Buffer.from(
      expected.toLowerCase(),
      'utf8',
    );

    const receivedBuffer = Buffer.from(
      received.toLowerCase(),
      'utf8',
    );

    if (
      expectedBuffer.length !== receivedBuffer.length
    ) {
      return false;
    }

    return timingSafeEqual(
      expectedBuffer,
      receivedBuffer,
    );
  }

  // ==========================================
  // PAYMENT STATUS
  // ==========================================

  private mapPaymentStatus(
    wompiStatus: string,
  ): PaymentStatus {
    switch (wompiStatus) {
      case 'APPROVED':
        return 'APPROVED';

      case 'DECLINED':
        return 'DECLINED';

      case 'VOIDED':
        return 'VOIDED';

      case 'ERROR':
        return 'ERROR';

      case 'PENDING':
        return 'PENDING';

      default:
        throw new BadRequestException(
          `Unsupported Wompi transaction status: ${wompiStatus}`,
        );
    }
  }

  // ==========================================
  // FINAL PAYMENT STATUS
  // ==========================================

  private isFinalPaymentStatus(
    status: string,
  ): boolean {
    return (
      status === 'APPROVED' ||
      status === 'DECLINED' ||
      status === 'VOIDED' ||
      status === 'ERROR'
    );
  }
}