import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
    ServiceUnavailableException,
} from '@nestjs/common';

import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../database/prisma/prisma.service.js';
import { CreatePaymentMethodDto } from '../../dto/create-payment-method.dto.js';
import { CreatePaymentTransactionDto } from '../../dto/create-payment-transaction.dto/create-payment-transaction.dto.js';
import { ProcessWompiTokenDto } from '../../dto/process-wompi-token.dto/process-wompi-token.dto.js';
import { WompiService } from '../wompi/wompi.service.js';
import { PaymentAuthorizationService } from '../payment-authorization/payment-authorization.service.js';

type LocalPaymentStatus =
    | 'PENDING'
    | 'APPROVED'
    | 'DECLINED'
    | 'VOIDED'
    | 'ERROR';

interface WompiTransactionData {
    id: string;
    reference: string;
    status: string;
    amount_in_cents: number;
    currency: string;
}

@Injectable()
export class PaymentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly wompiService: WompiService,
        private readonly paymentAuthorizationService: PaymentAuthorizationService,
    ) {}

    /**
     * Registra una fuente de pago.
     * No inicia un cobro.
     */
    async createPaymentMethod(
        dto: CreatePaymentMethodDto,
        userId: string,
        authorizationToken: string,
    ) {
        await this.paymentAuthorizationService.verifyPaymentAuthorization(
            authorizationToken,
            dto.subscriptionId,
        );

        await this.assertAuthorizedOwner(userId, dto.subscriptionId);

        const subscription = await this.getPayableSubscription(
            dto.subscriptionId,
        );

        await this.assertNoUnresolvedPayment(subscription.id);

        const owner = subscription.organization.members[0]?.user;

        if (!owner) {
            throw new NotFoundException(
                'Organization owner not found',
            );
        }

        const response = await this.wompiService.createPaymentSource({
            token: dto.token,
            sessionId: dto.sessionId,
            customerEmail: owner.email,
            acceptanceToken: dto.acceptanceToken,
            personalDataAuthToken: dto.personalDataAuthToken,
        });

        const source = response.data;

        if (!source?.id) {
            throw new ServiceUnavailableException(
                'Wompi did not return a valid payment source',
            );
        }

        const paymentMethod = await this.prisma.paymentMethod.create({
            data: {
                restaurantId: subscription.restaurantId,
                provider: 'WOMPI',
                type: 'CARD',
                status: 'ACTIVE',
                providerPaymentSourceId: String(source.id),
                brand:
                    source.public_data?.brand ??
                    source.brand ??
                    null,
                lastFour:
                    source.public_data?.last_four ??
                    source.last_four ??
                    null,
            },
            select: {
                id: true,
                type: true,
                status: true,
                brand: true,
                lastFour: true,
                providerPaymentSourceId: true,
                createdAt: true,
            },
        });

        return { data: paymentMethod };
    }

    /**
     * Tokeniza una tarjeta y solicita una transacción.
     */
    async processWompiToken(
        dto: ProcessWompiTokenDto,
        userId: string,
    ) {
        await this.paymentAuthorizationService.verifyPaymentAuthorization(
            dto.paymentAuthorizationToken,
            dto.subscriptionId,
        );

        await this.assertAuthorizedOwner(userId, dto.subscriptionId);

        if (
            dto.payment_source_type &&
            dto.payment_source_type !== 'CARD'
        ) {
            throw new BadRequestException(
                'Only CARD payment sources are supported',
            );
        }

        const subscription = await this.getPayableSubscription(
            dto.subscriptionId,
        );

        await this.assertNoUnresolvedPayment(subscription.id);

        const owner = subscription.organization.members[0]?.user;

        if (!owner) {
            throw new NotFoundException(
                'Organization owner not found',
            );
        }

        const acceptanceTokens =
            await this.wompiService.getAcceptanceTokens();

        const response = await this.wompiService.createPaymentSource({
            token: dto.payment_source_token,
            sessionId: dto.sessionId,
            customerEmail: owner.email,
            acceptanceToken: acceptanceTokens.acceptanceToken,
            personalDataAuthToken:
                acceptanceTokens.personalDataAuthToken,
        });

        const source = response.data;

        if (!source?.id) {
            throw new ServiceUnavailableException(
                'Wompi did not return a valid payment source',
            );
        }

        const paymentMethod = await this.prisma.paymentMethod.create({
            data: {
                restaurantId: subscription.restaurantId,
                provider: 'WOMPI',
                type: 'CARD',
                status: 'ACTIVE',
                providerPaymentSourceId: String(source.id),
                brand:
                    source.public_data?.brand ??
                    source.brand ??
                    null,
                lastFour:
                    source.public_data?.last_four ??
                    source.last_four ??
                    null,
            },
        });

        return this.createAndProcessTransaction({
            subscription,
            paymentMethodId: paymentMethod.id,
            paymentSourceId: String(source.id),
            customerEmail: owner.email,
            sessionId: dto.sessionId,
            acceptanceToken: acceptanceTokens.acceptanceToken,
            installments: 1,
        });
    }

    /**
     * Cobra mediante un método de pago registrado.
     */
    async createTransaction(
        dto: CreatePaymentTransactionDto,
        userId: string,
        authorizationToken: string,
    ) {
        await this.paymentAuthorizationService.verifyPaymentAuthorization(
            authorizationToken,
            dto.subscriptionId,
        );

        await this.assertAuthorizedOwner(userId, dto.subscriptionId);

        const subscription = await this.getPayableSubscription(
            dto.subscriptionId,
        );

        await this.assertNoUnresolvedPayment(subscription.id);

        const owner = subscription.organization.members[0]?.user;

        if (!owner) {
            throw new NotFoundException(
                'Organization owner not found',
            );
        }

        const paymentMethod =
            await this.prisma.paymentMethod.findFirst({
                where: {
                    id: dto.paymentMethodId,
                    restaurantId: subscription.restaurantId,
                    status: 'ACTIVE',
                    provider: 'WOMPI',
                },
            });

        if (!paymentMethod) {
            throw new NotFoundException(
                'Payment method not found',
            );
        }

        const acceptanceTokens =
            await this.wompiService.getAcceptanceTokens();

        return this.createAndProcessTransaction({
            subscription,
            paymentMethodId: paymentMethod.id,
            paymentSourceId:
                paymentMethod.providerPaymentSourceId,
            customerEmail: owner.email,
            sessionId: dto.sessionId,
            acceptanceToken: acceptanceTokens.acceptanceToken,
            installments: dto.installments,
        });
    }

    /**
     * Crea el pago local antes de solicitar el cobro.
     *
     * Nunca considera un timeout como un rechazo confirmado.
     * No activa la suscripción directamente.
     */
    private async createAndProcessTransaction(data: {
        subscription: any;
        paymentMethodId: string;
        paymentSourceId: string;
        customerEmail: string;
        sessionId: string;
        acceptanceToken: string;
        installments: number;
    }) {
        const subscription = data.subscription;
        const amount: bigint = subscription.plan.priceAmount;
        const currency: string = subscription.plan.currency;

        // priceAmount está expresado en pesos COP enteros.
        const amountInCents = amount * 100n;

        if (
            amount <= 0n ||
            amountInCents > BigInt(Number.MAX_SAFE_INTEGER)
        ) {
            throw new BadRequestException(
                'The subscription amount is invalid',
            );
        }

        const reference =
            `PROMO-${subscription.id}-${Date.now()}-${randomUUID()}`;

        const payment = await this.reservePaymentAttempt(
            subscription.id,
            {
                subscriptionId: subscription.id,
                paymentMethodId: data.paymentMethodId,
                provider: 'WOMPI',
                reference,
                amount,
                currency,
                status: 'PENDING',
            },
        );

        let response;

        try {
            response = await this.wompiService.createTransaction({
                amountInCents,
                currency,
                reference,
                customerEmail: data.customerEmail,
                paymentSourceId: data.paymentSourceId,
                installments: data.installments,
                sessionId: data.sessionId,
                acceptanceToken: data.acceptanceToken,
            });
        } catch {
            throw new ServiceUnavailableException({
                message:
                    'No se pudo confirmar la respuesta de Wompi. El pago permanece pendiente de verificación.',
                paymentId: payment.id,
                reference: payment.reference,
                status: 'PENDING',
            });
        }

        const transaction = response?.data;

        if (
            !transaction?.id ||
            !transaction.reference ||
            !transaction.status
        ) {
            throw new ServiceUnavailableException({
                message:
                    'Wompi devolvió una respuesta incompleta. El pago permanece pendiente de verificación.',
                paymentId: payment.id,
                reference: payment.reference,
                status: 'PENDING',
            });
        }

        this.validateTransactionResponse(
            transaction,
            payment.reference,
            amountInCents,
            currency,
        );

        /*
         * Evita asociar un identificador de transacción a otro pago.
         * providerTransactionId tiene una restricción UNIQUE.
         */
        const updatedPayment = await this.prisma.payment.update({
            where: {
                id: payment.id,
            },
            data: {
                providerTransactionId: transaction.id,
            },
            select: {
                id: true,
                reference: true,
                amount: true,
                currency: true,
                status: true,
            },
        });

        return {
            data: {
                payment: {
                    id: updatedPayment.id,
                    reference: updatedPayment.reference,
                    amount: updatedPayment.amount.toString(),
                    currency: updatedPayment.currency,
                    status: updatedPayment.status,
                },
                transaction: {
                    id: transaction.id,
                    status: transaction.status,
                    reference: transaction.reference,
                },
            },
        };
    }

    /**
     * Reserva un pago con bloqueo de la suscripción.
     */
    private async reservePaymentAttempt(
        subscriptionId: string,
        paymentData: Prisma.PaymentUncheckedCreateInput,
    ) {
        return this.prisma.$transaction(async (tx) => {
            const subscriptions = await tx.$queryRaw<
                { id: string }[]
            >`
                SELECT id
                FROM \`subscriptions\`
                WHERE id = ${subscriptionId}
                FOR UPDATE
            `;

            if (subscriptions.length === 0) {
                throw new NotFoundException(
                    'Subscription not found',
                );
            }

            const subscription =
                await tx.subscription.findUnique({
                    where: { id: subscriptionId },
                    select: { status: true },
                });

            if (
                !subscription ||
                subscription.status !== 'PENDING'
            ) {
                throw new ConflictException(
                    'This subscription is no longer payable',
                );
            }

            const pendingPayment = await tx.payment.findFirst({
                where: {
                    subscriptionId,
                    status: 'PENDING',
                },
                select: {
                    id: true,
                    reference: true,
                },
            });

            if (pendingPayment) {
                throw new ConflictException({
                    message:
                        'Ya existe un pago pendiente para esta suscripción. Debe verificarse antes de iniciar otro cobro.',
                    paymentId: pendingPayment.id,
                    reference: pendingPayment.reference,
                });
            }

            const approvedPayment = await tx.payment.findFirst({
                where: {
                    subscriptionId,
                    status: 'APPROVED',
                },
                select: { id: true },
            });

            if (approvedPayment) {
                throw new ConflictException(
                    'Esta suscripción ya tiene un pago aprobado',
                );
            }

            return tx.payment.create({
                data: paymentData,
            });
        });
    }

    /**
     * Valida referencia, importe y moneda.
     */
    private validateTransactionResponse(
        transaction: WompiTransactionData,
        expectedReference: string,
        expectedAmountInCents: bigint,
        expectedCurrency: string,
    ): void {
        if (transaction.reference !== expectedReference) {
            throw new ServiceUnavailableException(
                'La referencia de Wompi no coincide con el pago registrado.',
            );
        }

        if (
            !Number.isSafeInteger(transaction.amount_in_cents) ||
            transaction.amount_in_cents < 0 ||
            BigInt(transaction.amount_in_cents) !==
                expectedAmountInCents
        ) {
            throw new ServiceUnavailableException(
                'El monto de Wompi no coincide con el pago registrado.',
            );
        }

        if (transaction.currency !== expectedCurrency) {
            throw new ServiceUnavailableException(
                'La moneda de Wompi no coincide con el pago registrado.',
            );
        }
    }

    /**
     * Consulta Wompi y reconcilia el estado del pago.
     */
    private async reconcilePayment(
        paymentId: string,
    ): Promise<LocalPaymentStatus> {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                subscription: {
                    include: { plan: true },
                },
            },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        if (payment.status !== 'PENDING') {
            return payment.status;
        }

        if (!payment.providerTransactionId) {
            throw new ConflictException({
                message:
                    'El pago sigue pendiente y no tiene identificador de Wompi. Debe verificarse antes de iniciar otro cobro.',
                paymentId: payment.id,
                reference: payment.reference,
                status: 'PENDING',
            });
        }

        let response;

        try {
            response = await this.wompiService.getTransaction(
                payment.providerTransactionId,
            );
        } catch {
            throw new ServiceUnavailableException({
                message:
                    'No fue posible consultar Wompi. El pago permanece pendiente para evitar cobros duplicados.',
                paymentId: payment.id,
                reference: payment.reference,
                status: 'PENDING',
            });
        }

        const transaction = response.data;

        this.validateTransactionResponse(
            transaction,
            payment.reference,
            payment.amount * 100n,
            payment.currency,
        );

        const status = this.mapWompiStatus(transaction.status);

        if (status === 'PENDING') {
            return 'PENDING';
        }

        await this.prisma.$transaction(async (tx) => {
            /*
             * Bloqueamos primero el pago y después la organización.
             * Así serializamos la activación de suscripciones
             * dentro de una misma organización.
             */
            await tx.$queryRaw<{ id: string }[]>`
                SELECT id
                FROM \`payments\`
                WHERE id = ${payment.id}
                FOR UPDATE
            `;

            const currentPayment =
                await tx.payment.findUnique({
                    where: { id: payment.id },
                    include: {
                        subscription: {
                            include: { plan: true },
                        },
                    },
                });

            if (!currentPayment) {
                throw new NotFoundException('Payment not found');
            }

            if (
                currentPayment.providerTransactionId &&
                currentPayment.providerTransactionId !== transaction.id
            ) {
                throw new ConflictException(
                    'El identificador de transacción de Wompi no coincide.',
                );
            }

            if (currentPayment.status !== 'PENDING') {
                return;
            }

            const subscription = currentPayment.subscription;

            if (status === 'APPROVED') {
                await tx.$queryRaw<{ id: string }[]>`
                    SELECT id
                    FROM \`organizations\`
                    WHERE id = ${subscription.organizationId}
                    FOR UPDATE
                `;
            }

            const updated = await tx.payment.updateMany({
                where: {
                    id: currentPayment.id,
                    status: 'PENDING',
                },
                data: {
                    status,
                    providerTransactionId: transaction.id,
                    paidAt:
                        status === 'APPROVED'
                            ? new Date()
                            : null,
                },
            });

            if (updated.count !== 1 || status !== 'APPROVED') {
                return;
            }

            if (subscription.status !== 'PENDING') {
                return;
            }

            const now = new Date();

            const activeSubscription =
                await tx.subscription.findFirst({
                    where: {
                        organizationId: subscription.organizationId,
                        status: 'ACTIVE',
                        id: { not: subscription.id },
                        currentPeriodEnd: { gt: now },
                    },
                    select: { id: true },
                });

            /*
             * Si ya existe otra suscripción activa, no activamos
             * una segunda ni modificamos la suscripción histórica.
             */
            if (activeSubscription) {
                return;
            }

            const periodEnd = this.calculatePeriodEnd(
                now,
                subscription.plan.billingInterval,
            );

            await tx.subscription.updateMany({
                where: {
                    id: subscription.id,
                    status: 'PENDING',
                },
                data: {
                    status: 'ACTIVE',
                    startsAt: now,
                    currentPeriodStart: now,
                    currentPeriodEnd: periodEnd,
                },
            });
        });

        const updatedPayment = await this.prisma.payment.findUnique({
            where: { id: payment.id },
            select: { status: true },
        });

        if (!updatedPayment) {
            throw new NotFoundException('Payment not found');
        }

        return updatedPayment.status;
    }

    /**
     * Impide otro cobro mientras existan intentos sin resolver.
     */
    private async assertNoUnresolvedPayment(
        subscriptionId: string,
    ): Promise<void> {
        const pendingPayments = await this.prisma.payment.findMany({
            where: {
                subscriptionId,
                status: 'PENDING',
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                reference: true,
            },
        });

        for (const payment of pendingPayments) {
            const status = await this.reconcilePayment(payment.id);

            if (status === 'PENDING') {
                throw new ConflictException({
                    message:
                        'Existe un pago pendiente. Verifica su estado antes de iniciar otro cobro.',
                    paymentId: payment.id,
                    reference: payment.reference,
                    status,
                });
            }

            if (status === 'APPROVED') {
                throw new ConflictException({
                    message:
                        'Ya existe un pago aprobado para esta suscripción.',
                    paymentId: payment.id,
                    reference: payment.reference,
                    status,
                });
            }
        }
    }

    private mapWompiStatus(
        wompiStatus: string,
    ): LocalPaymentStatus {
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
                throw new ServiceUnavailableException(
                    'Wompi devolvió un estado desconocido. No se puede autorizar otro cobro.',
                );
        }
    }

    /**
     * Verifica que el usuario sea OWNER de la organización.
     */
    private async assertAuthorizedOwner(
        userId: string,
        subscriptionId: string,
    ): Promise<void> {
        const subscription =
            await this.prisma.subscription.findUnique({
                where: { id: subscriptionId },
                select: { organizationId: true },
            });

        if (!subscription) {
            throw new NotFoundException('Subscription not found');
        }

        const membership =
            await this.prisma.organizationMember.findUnique({
                where: {
                    userId_organizationId: {
                        userId,
                        organizationId: subscription.organizationId,
                    },
                },
                select: { role: true },
            });

        if (!membership || membership.role !== 'OWNER') {
            throw new ForbiddenException(
                'You are not authorized to pay this subscription',
            );
        }
    }

    /**
     * Obtiene la suscripción pendiente que puede pagarse.
     */
    private async getPayableSubscription(subscriptionId: string) {
        const subscription =
            await this.prisma.subscription.findUnique({
                where: { id: subscriptionId },
                include: {
                    restaurant: true,
                    organization: {
                        include: {
                            members: {
                                where: { role: 'OWNER' },
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            email: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    plan: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                            priceAmount: true,
                            currency: true,
                            billingInterval: true,
                            requiresPayment: true,
                        },
                    },
                },
            });

        if (!subscription) {
            throw new NotFoundException('Subscription not found');
        }

        if (subscription.status !== 'PENDING') {
            throw new BadRequestException(
                'Only pending subscriptions can be paid. Create a new subscription to renew an expired plan.',
            );
        }

        if (!subscription.plan.requiresPayment) {
            throw new BadRequestException(
                'This subscription does not require payment',
            );
        }

        if (
            subscription.restaurant.organizationId !==
            subscription.organizationId
        ) {
            throw new BadRequestException(
                'Subscription and restaurant organization do not match',
            );
        }

        return subscription;
    }

    async getMerchantInfo() {
        return this.wompiService.getMerchantInfo();
    }

    async getAcceptanceTokens() {
        return this.wompiService.getAcceptanceTokens();
    }

    /**
     * Consulta el pago más reciente sin iniciar nuevos cobros.
     */
    async getLatestSubscriptionPayment(
        subscriptionId: string,
        userId: string,
    ) {
        await this.assertAuthorizedOwner(userId, subscriptionId);

        const subscription =
            await this.prisma.subscription.findUnique({
                where: { id: subscriptionId },
                select: { id: true },
            });

        if (!subscription) {
            throw new NotFoundException('Subscription not found');
        }

        let payment = await this.prisma.payment.findFirst({
            where: { subscriptionId },
            orderBy: [
                { createdAt: 'desc' },
                { id: 'desc' },
            ],
            select: {
                id: true,
                reference: true,
                status: true,
                amount: true,
                currency: true,
                providerTransactionId: true,
                createdAt: true,
                paidAt: true,
            },
        });

        if (!payment) {
            return { data: null };
        }

        if (
            payment.status === 'PENDING' &&
            payment.providerTransactionId
        ) {
            try {
                await this.reconcilePayment(payment.id);
            } catch (error) {
                if (
                    !(error instanceof ConflictException) &&
                    !(error instanceof ServiceUnavailableException)
                ) {
                    throw error;
                }
            }

            payment = await this.prisma.payment.findUnique({
                where: { id: payment.id },
                select: {
                    id: true,
                    reference: true,
                    status: true,
                    amount: true,
                    currency: true,
                    providerTransactionId: true,
                    createdAt: true,
                    paidAt: true,
                },
            });

            if (!payment) {
                throw new NotFoundException('Payment not found');
            }
        }

        return {
            data: {
                id: payment.id,
                reference: payment.reference,
                status: payment.status,
                amount: payment.amount.toString(),
                currency: payment.currency,
                createdAt: payment.createdAt,
                paidAt: payment.paidAt,
            },
        };
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