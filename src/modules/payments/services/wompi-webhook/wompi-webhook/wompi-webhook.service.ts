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
     * 1.
     * Validamos que sea el evento que
     * esperamos procesar.
     */

    if (
      event.event !==
      'transaction.updated'
    ) {
      return {
        processed: false,
        message: 'Event ignored',
      };
    }

    /*
     * 2.
     * Validamos la estructura mínima
     * del evento.
     */

    const transaction =
      event.data?.transaction;

    if (!transaction) {
      throw new BadRequestException(
        'Wompi transaction data is missing',
      );
    }

    if (
      !event.signature ||
      !Array.isArray(
        event.signature.properties,
      ) ||
      event.signature.properties.length === 0 ||
      !event.signature.checksum
    ) {
      throw new BadRequestException(
        'Wompi event signature is missing',
      );
    }

    if (
      !event.timestamp ||
      !Number.isInteger(
        event.timestamp,
      )
    ) {
      throw new BadRequestException(
        'Wompi event timestamp is invalid',
      );
    }

    /*
     * 3.
     * Validamos el entorno.
     *
     * Wompi utiliza:
     *
     * test = Sandbox
     * prod = Producción
     */

    this.validateEnvironment(
      event.environment,
    );

    /*
     * 4.
     * Validamos el checksum de Wompi.
     *
     * Wompi indica que el checksum puede
     * recibirse mediante:
     *
     * X-Event-Checksum
     *
     * o:
     *
     * signature.checksum
     */

    this.validateChecksum(
      event,
      headerChecksum,
    );

    /*
     * 5.
     * Buscamos nuestro Payment.
     *
     * Primero buscamos por el ID de
     * transacción de Wompi.
     *
     * Si todavía no existe, utilizamos
     * la referencia.
     */

    let payment =
      await this.prisma.payment.findUnique({
        where: {
          providerTransactionId:
            transaction.id,
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
            reference:
              transaction.reference,
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
     * 6.
     * Si no encontramos nuestro Payment,
     * no creamos registros.
     */

    if (!payment) {
      throw new BadRequestException(
        'Payment not found for Wompi transaction',
      );
    }

    /*
     * 7.
     * Validamos que la referencia recibida
     * corresponda exactamente a nuestro pago.
     */

    if (
      transaction.reference !==
      payment.reference
    ) {
      throw new BadRequestException(
        'Wompi transaction reference does not match payment',
      );
    }

    /*
     * 8.
     * Validamos el monto.
     *
     * Nuestro Payment almacena el valor
     * en pesos COP.
     *
     * Wompi trabaja en centavos.
     *
     * Ejemplo:
     *
     * BD:
     * 39000
     *
     * Wompi:
     * 3900000
     */

    const expectedAmountInCents =
      payment.amount * 100n;

    const receivedAmountInCents =
      BigInt(
        transaction.amount_in_cents,
      );

    if (
      receivedAmountInCents !==
      expectedAmountInCents
    ) {
      throw new BadRequestException(
        'Wompi transaction amount does not match payment',
      );
    }

    /*
     * 9.
     * Validamos la moneda.
     */

    if (
      transaction.currency !==
      payment.currency
    ) {
      throw new BadRequestException(
        'Wompi transaction currency does not match payment',
      );
    }

    /*
     * 10.
     * Convertimos el estado de Wompi
     * al enum de nuestro sistema.
     */

    const paymentStatus =
      this.mapPaymentStatus(
        transaction.status,
      );

    /*
     * 11.
     * Actualizamos Payment y Subscription
     * dentro de una única transacción.
     */

    const result =
      await this.prisma.$transaction(
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
           * 12.
           * Protección contra estados finales.
           *
           * Una vez que un pago está APPROVED,
           * DECLINED, VOIDED o ERROR,
           * no permitimos que un evento posterior
           * lo haga retroceder a otro estado.
           */

          if (
            this.isFinalPaymentStatus(
              currentPayment.status,
            )
          ) {
            /*
             * Si recibimos exactamente el mismo
             * estado, es simplemente un webhook
             * duplicado.
             */

            if (
              currentPayment.status ===
              paymentStatus
            ) {
              return {
                payment:
                  currentPayment,

                subscription:
                  currentPayment.subscription,

                alreadyProcessed:
                  true,
              };
            }

            /*
             * Si llega otro estado después de uno
             * final, no modificamos el pago.
             *
             * Esto evita:
             *
             * APPROVED -> PENDING
             * APPROVED -> ERROR
             * APPROVED -> DECLINED
             */

            return {
              payment:
                currentPayment,

              subscription:
                currentPayment.subscription,

              alreadyProcessed:
                true,
            };
          }

          /*
           * 13.
           * Si el estado actual y el nuevo estado
           * son iguales, no necesitamos actualizar.
           */

          if (
            currentPayment.status ===
            paymentStatus
          ) {
            return {
              payment:
                currentPayment,

              subscription:
                currentPayment.subscription,

              alreadyProcessed:
                true,
            };
          }

          /*
           * 14.
           * Actualizamos Payment.
           */

          const updatedPayment =
            await tx.payment.update({
              where: {
                id:
                  currentPayment.id,
              },

              data: {
                status:
                  paymentStatus,

                providerTransactionId:
                  transaction.id,

                paidAt:
                  paymentStatus ===
                  'APPROVED'
                    ? new Date()
                    : null,
              },
            });

          /*
           * 15.
           * Por defecto mantenemos la suscripción
           * sin cambios.
           */

          let updatedSubscription =
            currentPayment.subscription;

          /*
           * 16.
           * Si Wompi aprobó el pago,
           * activamos la suscripción.
           */

          if (
            paymentStatus ===
            'APPROVED'
          ) {
            const now =
              new Date();

            updatedSubscription =
              await tx.subscription.update({
                where: {
                  id:
                    currentPayment
                      .subscriptionId,
                },

                data: {
                  status:
                    'ACTIVE',

                  currentPeriodStart:
                    now,
                },
              });
          }

          return {
            payment:
              updatedPayment,

            subscription:
              updatedSubscription,

            alreadyProcessed:
              false,
          };
        },
      );

    /*
     * 17.
     * Respuesta final del procesamiento.
     */

    return {
      processed: true,

      alreadyProcessed:
        result.alreadyProcessed,

      paymentId:
        result.payment.id,

      subscriptionId:
        result.subscription.id,

      paymentStatus:
        result.payment.status,

      subscriptionStatus:
        result.subscription.status,
    };
  }

  // ==========================================
  // ENVIRONMENT
  // ==========================================

  private validateEnvironment(
    wompiEnvironment:
      | 'test'
      | 'prod',
  ): void {
    /*
     * Nuestro backend de desarrollo/test
     * debe recibir eventos de Sandbox.
     *
     * Nuestro backend de producción
     * debe recibir eventos de producción.
     */

    const expectedEnvironment =
      this.nodeEnvironment ===
      'production'
        ? 'prod'
        : 'test';

    if (
      wompiEnvironment !==
      expectedEnvironment
    ) {
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
    const properties =
      event.signature.properties;

    /*
     * Wompi puede cambiar las propiedades
     * utilizadas para construir la firma.
     *
     * Por eso NO debemos asumir:
     *
     * transaction.id
     * transaction.status
     * transaction.amount_in_cents
     *
     * como valores fijos.
     */

    const values =
      properties.map(
        (property) =>
          this.getPropertyValue(
            event.data,
            property,
          ),
      );

    /*
     * Wompi calcula:
     *
     * valores de properties
     * +
     * timestamp
     * +
     * events secret
     */

    const payload =
      `${values.join('')}${event.timestamp}${this.eventsSecret}`;

    const calculatedChecksum =
      createHash('sha256')
        .update(payload)
        .digest('hex');

    /*
     * Preferimos el header HTTP.
     *
     * Si no existe, utilizamos el checksum
     * enviado dentro del body.
     */

    const receivedChecksum =
      (
        headerChecksum ||
        event.signature.checksum
      ).trim();

    if (
      !receivedChecksum
    ) {
      throw new UnauthorizedException(
        'Wompi event checksum is missing',
      );
    }

    const isValid =
      this.safeCompare(
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
    const parts =
      property.split('.');

    let current:
      unknown =
      data;

    for (
      const part of parts
    ) {
      if (
        current === null ||
        typeof current !==
          'object'
      ) {
        throw new BadRequestException(
          `Wompi signature property "${property}" could not be resolved`,
        );
      }

      const record =
        current as Record<
          string,
          unknown
        >;

      if (
        !(part in record)
      ) {
        throw new BadRequestException(
          `Wompi signature property "${property}" does not exist`,
        );
      }

      current =
        record[part];
    }

    if (
      current === null ||
      current === undefined
    ) {
      throw new BadRequestException(
        `Wompi signature property "${property}" is empty`,
      );
    }

    return String(
      current,
    );
  }

  // ==========================================
  // SAFE CHECKSUM COMPARISON
  // ==========================================

  private safeCompare(
    expected: string,
    received: string,
  ): boolean {
    const expectedBuffer =
      Buffer.from(
        expected.toLowerCase(),
        'utf8',
      );

    const receivedBuffer =
      Buffer.from(
        received.toLowerCase(),
        'utf8',
      );

    if (
      expectedBuffer.length !==
      receivedBuffer.length
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
    switch (
      wompiStatus
    ) {
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