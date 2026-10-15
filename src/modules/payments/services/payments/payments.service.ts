import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../../database/prisma/prisma.service.js';

import { CreatePaymentMethodDto } from '../../dto/create-payment-method.dto.js';

import { CreatePaymentTransactionDto } from '../../dto/create-payment-transaction.dto/create-payment-transaction.dto.js';

import { ProcessWompiTokenDto } from '../../dto/process-wompi-token.dto/process-wompi-token.dto.js';

import { WompiService } from '../wompi/wompi.service.js';

import { PaymentAuthorizationService } from '../payment-authorization/payment-authorization.service.js';

@Injectable()
export class PaymentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly wompiService: WompiService,
        private readonly paymentAuthorizationService: PaymentAuthorizationService,
    ) { }

    async createPaymentMethod(
        dto: CreatePaymentMethodDto,
        userId: string,
        authorizationToken: string,
    ) {
        await this.paymentAuthorizationService.verifyPaymentAuthorization(
            authorizationToken,
            dto.subscriptionId,
        );

        await this.assertAuthorizedOwner(
            userId,
            dto.subscriptionId,
        );

        const subscription = await this.getPendingPaidSubscription(
            dto.subscriptionId,
        );

        const owner = subscription.restaurant.memberships[0]?.user;

        if (!owner) {
            throw new NotFoundException('Restaurant owner not found');
        }

        const wompiPaymentSource =
            await this.wompiService.createPaymentSource({
                token: dto.token,
                sessionId: dto.sessionId,
                customerEmail: owner.email,
                acceptanceToken: dto.acceptanceToken,
                personalDataAuthToken: dto.personalDataAuthToken,
            });

        const paymentSource = wompiPaymentSource.data;

        if (!paymentSource?.id) {
            throw new BadRequestException(
                'Wompi did not return a valid payment source',
            );
        }

        const paymentMethod = await this.prisma.paymentMethod.create({
            data: {
                restaurantId: subscription.restaurantId,
                provider: 'WOMPI',
                type: 'CARD',
                status: 'ACTIVE',
                providerPaymentSourceId: String(paymentSource.id),
                brand:
                    paymentSource.public_data?.brand ??
                    paymentSource.brand ??
                    null,
                lastFour:
                    paymentSource.public_data?.last_four ??
                    paymentSource.last_four ??
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

        return {
            data: paymentMethod,
        };
    }

    async processWompiToken(
        dto: ProcessWompiTokenDto,
        userId: string,
    ) {
        await this.paymentAuthorizationService.verifyPaymentAuthorization(
            dto.paymentAuthorizationToken,
            dto.subscriptionId,
        );

        await this.assertAuthorizedOwner(
            userId,
            dto.subscriptionId,
        );

        if (
            dto.payment_source_type &&
            dto.payment_source_type !== 'CARD'
        ) {
            throw new BadRequestException(
                'Only CARD payment sources are supported',
            );
        }

        const subscription = await this.getPendingPaidSubscription(
            dto.subscriptionId,
        );

        const owner = subscription.restaurant.memberships[0]?.user;

        if (!owner) {
            throw new NotFoundException('Restaurant owner not found');
        }

        const existingPayment = await this.prisma.payment.findFirst({
            where: {
                subscriptionId: subscription.id,
                status: 'PENDING',
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (existingPayment) {
            throw new BadRequestException(
                'There is already a pending payment for this subscription',
            );
        }

        const acceptanceTokens =
            await this.wompiService.getAcceptanceTokens();

        const wompiPaymentSource =
            await this.wompiService.createPaymentSource({
                token: dto.payment_source_token,
                sessionId: dto.sessionId,
                customerEmail: owner.email,
                acceptanceToken: acceptanceTokens.acceptanceToken,
                personalDataAuthToken:
                    acceptanceTokens.personalDataAuthToken,
            });

        const paymentSource = wompiPaymentSource.data;

        if (!paymentSource?.id) {
            throw new BadRequestException(
                'Wompi did not return a valid payment source',
            );
        }

        const paymentMethod = await this.prisma.paymentMethod.create({
            data: {
                restaurantId: subscription.restaurantId,
                provider: 'WOMPI',
                type: 'CARD',
                status: 'ACTIVE',
                providerPaymentSourceId: String(paymentSource.id),
                brand:
                    paymentSource.public_data?.brand ??
                    paymentSource.brand ??
                    null,
                lastFour:
                    paymentSource.public_data?.last_four ??
                    paymentSource.last_four ??
                    null,
            },
        });

        const reference = `PROMO-${subscription.id}-${Date.now()}`;
        const amount = subscription.plan.priceAmount;
        const currency = subscription.plan.currency;
        const amountInCents = amount * 100n;

        const payment = await this.prisma.payment.create({
            data: {
                subscriptionId: subscription.id,
                paymentMethodId: paymentMethod.id,
                provider: 'WOMPI',
                reference,
                amount,
                currency,
                status: 'PENDING',
            },
        });

        try {
            const wompiTransaction =
                await this.wompiService.createTransaction({
                    amountInCents,
                    currency,
                    reference,
                    customerEmail: owner.email,
                    paymentSourceId: String(paymentSource.id),
                    installments: 1,
                    sessionId: dto.sessionId,
                    acceptanceToken: acceptanceTokens.acceptanceToken,
                });

            const transaction = wompiTransaction.data;

            if (!transaction?.id) {
                throw new BadRequestException(
                    'Wompi did not return a valid transaction',
                );
            }

            const updatedPayment = await this.prisma.payment.update({
                where: {
                    id: payment.id,
                },
                data: {
                    providerTransactionId: String(transaction.id),
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
                        id: String(transaction.id),
                        status: transaction.status,
                        reference: transaction.reference,
                    },
                },
            };
        } catch (error) {
            await this.prisma.payment.update({
                where: {
                    id: payment.id,
                },
                data: {
                    status: 'ERROR',
                },
            });

            throw error;
        }
    }

    async createTransaction(
        dto: CreatePaymentTransactionDto,
        userId: string,
        authorizationToken: string,
    ) {
        await this.paymentAuthorizationService.verifyPaymentAuthorization(
            authorizationToken,
            dto.subscriptionId,
        );

        await this.assertAuthorizedOwner(
            userId,
            dto.subscriptionId,
        );

        const subscription = await this.getPendingPaidSubscription(
            dto.subscriptionId,
        );

        const owner = subscription.restaurant.memberships[0]?.user;

        if (!owner) {
            throw new NotFoundException('Restaurant owner not found');
        }

        const paymentMethod = await this.prisma.paymentMethod.findFirst({
            where: {
                id: dto.paymentMethodId,
                restaurantId: subscription.restaurantId,
                status: 'ACTIVE',
                provider: 'WOMPI',
            },
        });

        if (!paymentMethod) {
            throw new NotFoundException('Payment method not found');
        }

        const existingPayment = await this.prisma.payment.findFirst({
            where: {
                subscriptionId: subscription.id,
                status: 'PENDING',
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (existingPayment) {
            throw new BadRequestException(
                'There is already a pending payment for this subscription',
            );
        }

        const reference = `PROMO-${subscription.id}-${Date.now()}`;
        const amount = subscription.plan.priceAmount;
        const currency = subscription.plan.currency;
        const amountInCents = amount * 100n;

        const acceptanceTokens =
            await this.wompiService.getAcceptanceTokens();

        const payment = await this.prisma.payment.create({
            data: {
                subscriptionId: subscription.id,
                paymentMethodId: paymentMethod.id,
                provider: 'WOMPI',
                reference,
                amount,
                currency,
                status: 'PENDING',
            },
        });

        try {
            const wompiTransaction =
                await this.wompiService.createTransaction({
                    amountInCents,
                    currency,
                    reference,
                    customerEmail: owner.email,
                    paymentSourceId:
                        paymentMethod.providerPaymentSourceId,
                    installments: dto.installments,
                    sessionId: dto.sessionId,
                    acceptanceToken: acceptanceTokens.acceptanceToken,
                });

            const transaction = wompiTransaction.data;

            if (!transaction?.id) {
                throw new BadRequestException(
                    'Wompi did not return a valid transaction',
                );
            }

            const updatedPayment = await this.prisma.payment.update({
                where: {
                    id: payment.id,
                },
                data: {
                    providerTransactionId: String(transaction.id),
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
                        id: String(transaction.id),
                        status: transaction.status,
                        reference: transaction.reference,
                    },
                },
            };
        } catch (error) {
            await this.prisma.payment.update({
                where: {
                    id: payment.id,
                },
                data: {
                    status: 'ERROR',
                },
            });

            throw error;
        }
    }

    private async assertAuthorizedOwner(
        userId: string,
        subscriptionId: string,
    ): Promise<void> {
        const subscription = await this.prisma.subscription.findUnique({
            where: {
                id: subscriptionId,
            },
            select: {
                organizationId: true,
            },
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
                select: {
                    role: true,
                },
            });

        if (!membership || membership.role !== 'OWNER') {
            throw new ForbiddenException(
                'You are not authorized to pay this subscription',
            );
        }
    }

    private async getPendingPaidSubscription(
        subscriptionId: string,
    ) {
        const subscription = await this.prisma.subscription.findUnique({
            where: {
                id: subscriptionId,
            },
            include: {
                restaurant: {
                    include: {
                        memberships: {
                            where: {
                                role: 'OWNER',
                            },
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
                'Subscription is not pending payment',
            );
        }

        if (!subscription.plan.requiresPayment) {
            throw new BadRequestException(
                'This subscription does not require payment',
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
}