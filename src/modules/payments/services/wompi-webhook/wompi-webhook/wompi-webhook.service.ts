import {
    BadRequestException,
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

import {
    createHash,
    timingSafeEqual,
} from 'node:crypto';

import { PrismaService } from '../../../../../database/prisma/prisma.service.js';

type PaymentStatus =
    | 'PENDING'
    | 'APPROVED'
    | 'DECLINED'
    | 'VOIDED'
    | 'ERROR';

interface WompiTransaction {
    id: string;
    reference: string;
    status: string;
    amount_in_cents: number;
    currency: string;
}

interface WompiWebhookEvent {
    event?: string;
    data?: {
        transaction?: WompiTransaction;
    };
    signature?: {
        properties?: string[];
        checksum?: string;
    };
    timestamp?: number;
}

@Injectable()
export class WompiWebhookService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) { }

    async processTransactionUpdated(
        payload: WompiWebhookEvent,
    ) {
        if (
            !payload ||
            payload.event !== 'transaction.updated' ||
            !payload.data?.transaction
        ) {
            throw new BadRequestException(
                'Invalid Wompi webhook event',
            );
        }

        const transaction = payload.data.transaction;

        this.validateTransaction(transaction);
        this.validateWebhookSignature(payload);

        const incomingStatus = this.mapWompiStatus(
            transaction.status,
        );

        const payment = await this.prisma.payment.findUnique({
            where: {
                reference: transaction.reference,
            },
            select: {
                id: true,
                reference: true,
                amount: true,
                currency: true,
                provider: true,
            },
        });

        if (!payment) {
            throw new BadRequestException(
                'Payment reference not found',
            );
        }

        this.assertTransactionMatchesPayment(
            payment,
            transaction,
        );

        return this.prisma.$transaction(
            async (tx: Prisma.TransactionClient) => {
                const lockedPayments = await tx.$queryRaw<
                    { id: string }[]
                >`
          SELECT id
          FROM payments
          WHERE id = ${payment.id}
          FOR UPDATE
        `;

                if (lockedPayments.length === 0) {
                    throw new BadRequestException(
                        'Payment not found',
                    );
                }

                const currentPayment =
                    await tx.payment.findUnique({
                        where: {
                            id: payment.id,
                        },
                        include: {
                            subscription: {
                                include: {
                                    plan: true,
                                    renewalOfSubscription: {
                                        select: {
                                            id: true,
                                            organizationId: true,
                                            currentPeriodEnd: true,
                                        },
                                    },
                                },
                            },
                        },
                    });

                if (!currentPayment) {
                    throw new BadRequestException(
                        'Payment not found',
                    );
                }

                this.assertTransactionMatchesPayment(
                    currentPayment,
                    transaction,
                );

                if (
                    currentPayment.providerTransactionId &&
                    currentPayment.providerTransactionId !==
                    transaction.id
                ) {
                    throw new ConflictException(
                        'Wompi transaction ID does not match',
                    );
                }

                const currentStatus =
                    currentPayment.status as PaymentStatus;

                /*
                 * Eventos repetidos son idempotentes.
                 */
                if (currentStatus !== 'PENDING') {
                    if (currentStatus !== incomingStatus) {
                        throw new ConflictException(
                            'The payment already has a different final status',
                        );
                    }

                    return {
                        received: true,
                        reference: transaction.reference,
                        status: currentStatus,
                        alreadyProcessed: true,
                    };
                }

                /*
                 * Si Wompi informa que el pago sigue pendiente,
                 * no lo tratamos como resultado definitivo.
                 */
                if (incomingStatus === 'PENDING') {
                    if (
                        currentPayment.providerTransactionId &&
                        currentPayment.providerTransactionId !==
                        transaction.id
                    ) {
                        throw new ConflictException(
                            'Wompi transaction ID does not match',
                        );
                    }

                    await tx.payment.update({
                        where: {
                            id: currentPayment.id,
                        },
                        data: {
                            providerTransactionId: transaction.id,
                        },
                    });

                    return {
                        received: true,
                        reference: transaction.reference,
                        status: 'PENDING' as const,
                    };
                }

                /*
                 * Para APPROVED, la activación y la actualización
                 * del pago se ejecutan en la misma transacción.
                 * Si la activación falla, se revierte todo.
                 */
                if (incomingStatus === 'APPROVED') {
                    await this.activateSubscriptionIfEligible(
                        tx,
                        currentPayment.subscription.id,
                    );
                }

                await tx.payment.update({
                    where: {
                        id: currentPayment.id,
                    },
                    data: {
                        status: incomingStatus,
                        providerTransactionId: transaction.id,
                        paidAt:
                            incomingStatus === 'APPROVED'
                                ? new Date()
                                : null,
                    },
                });

                return {
                    received: true,
                    reference: transaction.reference,
                    status: incomingStatus,
                };
            },
        );
    }

    /**
     * Comprueba que los datos de Wompi coincidan con el pago local.
     */
    private assertTransactionMatchesPayment(
        payment: {
            reference: string;
            amount: bigint;
            currency: string;
            provider: string;
        },
        transaction: WompiTransaction,
    ): void {
        if (payment.reference !== transaction.reference) {
            throw new ConflictException(
                'Payment reference does not match',
            );
        }

        if (payment.provider !== 'WOMPI') {
            throw new BadRequestException(
                'Payment provider does not match',
            );
        }

        if (
            !Number.isSafeInteger(
                transaction.amount_in_cents,
            ) ||
            transaction.amount_in_cents < 0 ||
            payment.amount * 100n !==
            BigInt(transaction.amount_in_cents)
        ) {
            throw new BadRequestException(
                'Payment amount does not match',
            );
        }

        if (payment.currency !== transaction.currency) {
            throw new BadRequestException(
                'Payment currency does not match',
            );
        }
    }

    /**
     * Activa exclusivamente la suscripción vinculada al pago.
     */
    private async activateSubscriptionIfEligible(
        tx: Prisma.TransactionClient,
        subscriptionId: string,
    ): Promise<void> {
        const initialSubscription =
            await tx.subscription.findUnique({
                where: {
                    id: subscriptionId,
                },
                select: {
                    id: true,
                    organizationId: true,
                },
            });

        if (!initialSubscription) {
            throw new BadRequestException(
                'Subscription not found',
            );
        }

        /*
         * Serializa las activaciones dentro de la organización.
         */
        const organizations = await tx.$queryRaw<
            { id: string }[]
        >`
      SELECT id
      FROM organizations
      WHERE id = ${initialSubscription.organizationId}
      FOR UPDATE
    `;

        if (organizations.length === 0) {
            throw new BadRequestException(
                'Subscription organization not found',
            );
        }

        const subscription =
            await tx.subscription.findUnique({
                where: {
                    id: subscriptionId,
                },
                include: {
                    plan: true,
                    renewalOfSubscription: {
                        select: {
                            id: true,
                            organizationId: true,
                            status: true,
                            currentPeriodEnd: true,
                            scheduledPlanId: true,
                        },
                    },
                },
            });

        if (!subscription) {
            throw new BadRequestException(
                'Subscription not found',
            );
        }

        /*
         * Nunca reactivamos una suscripción histórica.
         */
        if (subscription.status !== 'PENDING') {
            throw new ConflictException(
                'Only pending subscriptions can be activated',
            );
        }

        /*
         * La renovación debe pertenecer a la misma organización.
         */
        if (
            subscription.renewalOfSubscription &&
            subscription.renewalOfSubscription.organizationId !==
            subscription.organizationId
        ) {
            throw new ConflictException(
                'Renewal organization does not match its original subscription',
            );
        }

        const now = new Date();

        /*
         * No permitimos dos suscripciones activas simultáneas
         * con períodos vigentes para la misma organización.
         */
        const activeSubscription =
            await tx.subscription.findFirst({
                where: {
                    organizationId: subscription.organizationId,
                    status: 'ACTIVE',
                    id: {
                        not: subscription.id,
                    },
                    currentPeriodEnd: {
                        gt: now,
                    },
                },
                select: {
                    id: true,
                },
            });

        if (activeSubscription) {
            throw new ConflictException(
                'Another active subscription exists for this organization',
            );
        }

        /*
         * El período nuevo comienza después del anterior si
         * su fecha de finalización todavía es futura.
         * En caso contrario, comienza en el momento de activación.
         */
        const previousEnd =
            subscription.renewalOfSubscription?.currentPeriodEnd;

        const periodStart =
            previousEnd && previousEnd > now
                ? previousEnd
                : now;

        const periodEnd = this.calculatePeriodEnd(
            periodStart,
            subscription.plan.billingInterval,
        );

        const activated =
            await tx.subscription.updateMany({
                where: {
                    id: subscription.id,
                    status: 'PENDING',
                },
                data: {
                    status: 'ACTIVE',
                    startsAt: periodStart,
                    currentPeriodStart: periodStart,
                    currentPeriodEnd: periodEnd,
                },
            });

        if (activated.count !== 1) {
            throw new ConflictException(
                'Subscription was modified concurrently',
            );
        }

        /*
         * Solo limpiamos el cambio programado después de activar
         * satisfactoriamente la renovación.
         */
        if (subscription.renewalOfSubscription) {
            await tx.subscription.update({
                where: {
                    id: subscription.renewalOfSubscription.id,
                },
                data: {
                    scheduledPlanId: null,
                },
            });
        }
    }

    private validateTransaction(
        transaction: WompiTransaction,
    ): void {
        if (
            !transaction ||
            typeof transaction.id !== 'string' ||
            !transaction.id.trim() ||
            typeof transaction.reference !== 'string' ||
            !transaction.reference.trim() ||
            typeof transaction.status !== 'string' ||
            !transaction.status.trim()
        ) {
            throw new BadRequestException(
                'Invalid transaction data',
            );
        }

        if (
            !Number.isSafeInteger(
                transaction.amount_in_cents,
            ) ||
            transaction.amount_in_cents < 0 ||
            typeof transaction.currency !== 'string' ||
            !transaction.currency.trim()
        ) {
            throw new BadRequestException(
                'Invalid transaction amount or currency',
            );
        }
    }

    /**
 * Valida el checksum del webhook de Wompi.
 *
 * No omite propiedades firmadas ni acepta firmas inválidas.
 */
    private validateWebhookSignature(
        payload: WompiWebhookEvent,
    ): void {
        const secret = this.configService.get<string>(
            'WOMPI_EVENTS_SECRET',
        );

        if (!secret) {
            throw new UnauthorizedException(
                'Wompi webhook secret is not configured',
            );
        }

        const signature = payload.signature;

        if (
            !signature ||
            typeof signature.checksum !== 'string' ||
            !/^[a-fA-F0-9]{64}$/.test(signature.checksum) ||
            !Array.isArray(signature.properties) ||
            signature.properties.length === 0 ||
            typeof payload.timestamp !== 'number' ||
            !Number.isSafeInteger(payload.timestamp)
        ) {
            throw new UnauthorizedException(
                'Invalid Wompi signature data',
            );
        }

        const values: string[] = [];

        for (const property of signature.properties) {
            const value = this.getPropertyValue(
                payload,
                property,
            );

            if (value === undefined || value === null) {
                /*
                 * No registrar el payload completo ni secretos.
                 * El nombre de la ruta ayuda a diagnosticar el problema.
                 */
                console.error(
                    '[Wompi webhook] Signed property not found:',
                    property,
                );

                throw new UnauthorizedException(
                    'Missing signed webhook property',
                );
            }

            values.push(String(value));
        }

        const checksumInput =
            values.join('') +
            String(payload.timestamp) +
            secret;

        const calculatedChecksum = createHash('sha256')
            .update(checksumInput, 'utf8')
            .digest('hex')
            .toUpperCase();

        const receivedChecksum =
            signature.checksum.toUpperCase();

        if (
            !this.safeCompare(
                calculatedChecksum,
                receivedChecksum,
            )
        ) {
            throw new UnauthorizedException(
                'Invalid Wompi webhook signature',
            );
        }
    }

    /**
    * Obtiene una propiedad anidada del payload de Wompi.
    *
    * Ejemplo:
    * getPropertyValue(payload, 'data.transaction.id')
    *
    * Devuelve undefined cuando la ruta no existe.
    * No modifica el payload ni interpreta sus valores.
    */
    private getPropertyValue(
        payload: WompiWebhookEvent,
        property: string,
    ): unknown {
        if (
            typeof property !== 'string' ||
            property.trim().length === 0
        ) {
            return undefined;
        }

        const parts = property.split('.');

        let current: unknown = payload;

        for (const part of parts) {
            if (
                typeof current !== 'object' ||
                current === null ||
                !Object.prototype.hasOwnProperty.call(
                    current,
                    part,
                )
            ) {
                /*
                 * Wompi puede indicar rutas como transaction.id,
                 * aunque la transacción esté dentro de data.transaction.
                 *
                 * Resolvemos esa ruta contra el objeto transaction
                 * del evento cuando la ruta original no existe.
                 */
                if (
                    parts[0] === 'transaction' &&
                    payload.data?.transaction
                ) {
                    let transactionValue: unknown =
                        payload.data.transaction;

                    for (const transactionPart of parts.slice(1)) {
                        if (
                            typeof transactionValue !== 'object' ||
                            transactionValue === null ||
                            !Object.prototype.hasOwnProperty.call(
                                transactionValue,
                                transactionPart,
                            )
                        ) {
                            return undefined;
                        }

                        transactionValue = (
                            transactionValue as Record<string, unknown>
                        )[transactionPart];
                    }

                    return transactionValue;
                }

                return undefined;
            }

            current = (
                current as Record<string, unknown>
            )[part];
        }

        return current;
    }

    private safeCompare(
        expected: string,
        received: string,
    ): boolean {
        const expectedBuffer = Buffer.from(expected);
        const receivedBuffer = Buffer.from(received);

        return (
            expectedBuffer.length === receivedBuffer.length &&
            timingSafeEqual(
                expectedBuffer,
                receivedBuffer,
            )
        );
    }

    private mapWompiStatus(
        status: string,
    ): PaymentStatus {
        switch (status) {
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
                    'Unknown Wompi transaction status',
                );
        }
    }

    private calculatePeriodEnd(
        start: Date,
        interval: 'MONTH' | 'YEAR',
    ): Date {
        const end = new Date(start);

        if (interval === 'YEAR') {
            end.setFullYear(end.getFullYear() + 1);
        } else {
            end.setMonth(end.getMonth() + 1);
        }

        return end;
    }
}