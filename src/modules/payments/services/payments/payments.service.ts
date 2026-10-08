import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../../database/prisma/prisma.service.js';

import { CreatePaymentMethodDto } from '../../dto/create-payment-method.dto.js';

import { CreatePaymentTransactionDto } from '../../dto/create-payment-transaction.dto/create-payment-transaction.dto.js';

import { ProcessWompiTokenDto } from '../../dto/process-wompi-token.dto/process-wompi-token.dto.js';

import { WompiService } from '../wompi/wompi.service.js';


@Injectable()
export class PaymentsService {

    constructor(
        private readonly prisma: PrismaService,

        private readonly wompiService: WompiService,
    ) { }


    // ==========================================
    // CREATE PAYMENT METHOD
    // ==========================================

    async createPaymentMethod(
        dto: CreatePaymentMethodDto,
    ) {

        const subscription =
            await this.getPendingPaidSubscription(
                dto.subscriptionId,
            );


        const owner =
            subscription.restaurant.memberships[0]?.user;


        if (!owner) {

            throw new NotFoundException(
                'Restaurant owner not found',
            );

        }


        const wompiPaymentSource =
            await this.wompiService
                .createPaymentSource({

                    token:
                        dto.token,

                    sessionId:
                        dto.sessionId,

                    customerEmail:
                        owner.email,

                    acceptanceToken:
                        dto.acceptanceToken,

                    personalDataAuthToken:
                        dto.personalDataAuthToken,

                });


        const paymentSource =
            wompiPaymentSource.data;


        if (!paymentSource?.id) {

            throw new BadRequestException(
                'Wompi did not return a valid payment source',
            );

        }


        const paymentMethod =
            await this.prisma.paymentMethod.create({

                data: {

                    restaurantId:
                        subscription.restaurantId,

                    provider:
                        'WOMPI',

                    type:
                        'CARD',

                    status:
                        'ACTIVE',

                    providerPaymentSourceId:
                        String(paymentSource.id),

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


    // ==========================================
    // PROCESS WOMPI TOKEN
    //
    // Este es el endpoint utilizado directamente
    // por el Widget de Wompi.
    //
    // Flujo:
    //
    // Widget
    //   ↓
    // payment_source_token
    //   ↓
    // Wompi Payment Source
    //   ↓
    // PaymentMethod
    //   ↓
    // Payment PENDING
    //   ↓
    // Wompi Transaction
    //
    // ==========================================

    async processWompiToken(
        dto: ProcessWompiTokenDto,
    ) {

        /*
         * 1.
         * Validamos que el tipo de fuente sea CARD.
         */

        if (
            dto.payment_source_type &&
            dto.payment_source_type !== 'CARD'
        ) {

            throw new BadRequestException(
                'Only CARD payment sources are supported',
            );

        }


        /*
         * 2.
         * Obtenemos la suscripción directamente
         * desde nuestra base de datos.
         *
         * Nunca confiamos en:
         *
         * - amount
         * - currency
         * - email
         * - plan
         *
         * enviados por el navegador.
         */

        const subscription =
            await this.getPendingPaidSubscription(
                dto.subscriptionId,
            );


        /*
         * 3.
         * Obtenemos el propietario del restaurante.
         */

        const owner =
            subscription.restaurant.memberships[0]?.user;


        if (!owner) {

            throw new NotFoundException(
                'Restaurant owner not found',
            );

        }


        /*
         * 4.
         * Evitamos crear otra operación si ya existe
         * un pago PENDING para esta suscripción.
         */

        const existingPayment =
            await this.prisma.payment.findFirst({

                where: {

                    subscriptionId:
                        subscription.id,

                    status:
                        'PENDING',

                },

                orderBy: {

                    createdAt:
                        'desc',

                },

            });


        if (existingPayment) {

            throw new BadRequestException(
                'There is already a pending payment for this subscription',
            );

        }


        /*
         * 5.
         * Obtenemos los acceptance tokens directamente
         * desde Wompi.
         *
         * No confiamos en datos enviados por Angular.
         */

        const acceptanceTokens =
            await this.wompiService
                .getAcceptanceTokens();


        /*
         * 6.
         * Creamos Payment Source en Wompi.
         *
         * El token proviene del Widget.
         *
         * El número de tarjeta y CVV nunca pasan
         * por nuestro backend.
         */

        const wompiPaymentSource =
            await this.wompiService
                .createPaymentSource({

                    token:
                        dto.payment_source_token,

                    sessionId:
                        dto.sessionId,

                    customerEmail:
                        owner.email,

                    acceptanceToken:
                        acceptanceTokens
                            .acceptanceToken,

                    personalDataAuthToken:
                        acceptanceTokens
                            .personalDataAuthToken,

                });


        const paymentSource =
            wompiPaymentSource.data;


        if (!paymentSource?.id) {

            throw new BadRequestException(
                'Wompi did not return a valid payment source',
            );

        }


        /*
         * 7.
         * Guardamos únicamente la referencia de Wompi.
         *
         * Nunca:
         *
         * - PAN
         * - CVV
         * - fecha completa
         *
         */

        const paymentMethod =
            await this.prisma.paymentMethod.create({

                data: {

                    restaurantId:
                        subscription.restaurantId,

                    provider:
                        'WOMPI',

                    type:
                        'CARD',

                    status:
                        'ACTIVE',

                    providerPaymentSourceId:
                        String(paymentSource.id),

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


        /*
         * 8.
         * Generamos nuestra propia referencia.
         */

        const reference =
            `PROMO-${subscription.id}-${Date.now()}`;


        /*
         * 9.
         * El monto sale exclusivamente del plan.
         */

        const amount =
            subscription.plan.priceAmount;


        const currency =
            subscription.plan.currency;


        /*
         * 10.
         * Wompi trabaja el valor en centavos.
         */

        const amountInCents =
            amount * 100n;


        /*
         * 11.
         * Creamos nuestro Payment en PENDING
         * antes de llamar a Wompi.
         */

        const payment =
            await this.prisma.payment.create({

                data: {

                    subscriptionId:
                        subscription.id,

                    paymentMethodId:
                        paymentMethod.id,

                    provider:
                        'WOMPI',

                    reference,

                    amount,

                    currency,

                    status:
                        'PENDING',

                },

            });


        try {

            /*
             * 12.
             * Creamos la transacción en Wompi.
             */

            const wompiTransaction =
                await this.wompiService
                    .createTransaction({

                        amountInCents,

                        currency,

                        reference,

                        customerEmail:
                            owner.email,

                        paymentSourceId:
                            String(
                                paymentSource.id,
                            ),

                        installments:

                            1,

                        sessionId:
                            dto.sessionId,

                        acceptanceToken:
                            acceptanceTokens
                                .acceptanceToken,

                    });


            const transaction =
                wompiTransaction.data;


            if (!transaction?.id) {

                throw new BadRequestException(
                    'Wompi did not return a valid transaction',
                );

            }


            /*
             * 13.
             * Guardamos el ID de la transacción Wompi.
             *
             * IMPORTANTE:
             *
             * El estado local sigue siendo PENDING.
             *
             * NO activamos la suscripción aquí.
             */

            const updatedPayment =
                await this.prisma.payment.update({

                    where: {

                        id:
                            payment.id,

                    },

                    data: {

                        providerTransactionId:
                            String(
                                transaction.id,
                            ),

                    },

                });


            /*
             * 14.
             * Devolvemos la información necesaria.
             */

            return {

                data: {

                    payment: {

                        id:
                            updatedPayment.id,

                        reference:
                            updatedPayment.reference,

                        amount:
                            updatedPayment.amount
                                .toString(),

                        currency:
                            updatedPayment.currency,

                        status:
                            updatedPayment.status,

                    },

                    transaction: {

                        id:
                            String(
                                transaction.id,
                            ),

                        status:
                            transaction.status,

                        reference:
                            transaction.reference,

                    },

                },

            };

        } catch (error) {

            /*
             * Si Wompi falla después de crear nuestro
             * Payment, lo marcamos ERROR.
             */

            await this.prisma.payment.update({

                where: {

                    id:
                        payment.id,

                },

                data: {

                    status:
                        'ERROR',

                },

            });


            throw error;

        }

    }


    // ==========================================
    // CREATE TRANSACTION
    //
    // Este endpoint REST se mantiene para
    // compatibilidad con el flujo anterior.
    //
    // El Widget nuevo utiliza processWompiToken().
    //
    // ==========================================

    async createTransaction(
        dto: CreatePaymentTransactionDto,
    ) {

        const subscription =
            await this.getPendingPaidSubscription(
                dto.subscriptionId,
            );


        const owner =
            subscription.restaurant.memberships[0]?.user;


        if (!owner) {

            throw new NotFoundException(
                'Restaurant owner not found',
            );

        }


        const paymentMethod =
            await this.prisma.paymentMethod.findFirst({

                where: {

                    id:
                        dto.paymentMethodId,

                    restaurantId:
                        subscription.restaurantId,

                    status:
                        'ACTIVE',

                    provider:
                        'WOMPI',

                },

            });


        if (!paymentMethod) {

            throw new NotFoundException(
                'Payment method not found',
            );

        }


        const existingPayment =
            await this.prisma.payment.findFirst({

                where: {

                    subscriptionId:
                        subscription.id,

                    status:
                        'PENDING',

                },

                orderBy: {

                    createdAt:
                        'desc',

                },

            });


        if (existingPayment) {

            throw new BadRequestException(
                'There is already a pending payment for this subscription',
            );

        }


        const reference =
            `PROMO-${subscription.id}-${Date.now()}`;


        const amount =
            subscription.plan.priceAmount;


        const amountInCents =
            amount * 100n;


        const acceptanceTokens =
            await this.wompiService
                .getAcceptanceTokens();


        const payment =
            await this.prisma.payment.create({

                data: {

                    subscriptionId:
                        subscription.id,

                    paymentMethodId:
                        paymentMethod.id,

                    provider:
                        'WOMPI',

                    reference,

                    amount,

                    currency:
                        subscription.plan.currency,

                    status:
                        'PENDING',

                },

            });


        try {

            const wompiTransaction =
                await this.wompiService
                    .createTransaction({

                        amountInCents,

                        currency:
                            subscription.plan.currency,

                        reference,

                        customerEmail:
                            owner.email,

                        paymentSourceId:
                            paymentMethod
                                .providerPaymentSourceId,

                        installments:
                            dto.installments,

                        sessionId:
                            dto.sessionId,

                        acceptanceToken:
                            acceptanceTokens
                                .acceptanceToken,

                    });


            const transaction =
                wompiTransaction.data;


            if (!transaction?.id) {

                throw new BadRequestException(
                    'Wompi did not return a valid transaction',
                );

            }


            const updatedPayment =
                await this.prisma.payment.update({

                    where: {

                        id:
                            payment.id,

                    },

                    data: {

                        providerTransactionId:
                            String(
                                transaction.id,
                            ),

                    },

                });


            return {

                data: {

                    payment: {

                        id:
                            updatedPayment.id,

                        reference:
                            updatedPayment.reference,

                        amount:
                            updatedPayment.amount
                                .toString(),

                        currency:
                            updatedPayment.currency,

                        status:
                            updatedPayment.status,

                    },

                    transaction: {

                        id:
                            String(
                                transaction.id,
                            ),

                        status:
                            transaction.status,

                        reference:
                            transaction.reference,

                    },

                },

            };

        } catch (error) {

            await this.prisma.payment.update({

                where: {

                    id:
                        payment.id,

                },

                data: {

                    status:
                        'ERROR',

                },

            });


            throw error;

        }

    }


    // ==========================================
    // PRIVATE
    // ==========================================

    private async getPendingPaidSubscription(
        subscriptionId: string,
    ) {

        const subscription =
            await this.prisma.subscription.findUnique({

                where: {

                    id:
                        subscriptionId,

                },

                include: {

                    restaurant: {

                        include: {

                            memberships: {

                                where: {

                                    role:
                                        'OWNER',

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

            throw new NotFoundException(
                'Subscription not found',
            );

        }


        if (
            subscription.status !==
            'PENDING'
        ) {

            throw new BadRequestException(
                'Subscription is not pending payment',
            );

        }


        if (
            !subscription.plan.requiresPayment
        ) {

            throw new BadRequestException(
                'This subscription does not require payment',
            );

        }


        return subscription;

    }

}