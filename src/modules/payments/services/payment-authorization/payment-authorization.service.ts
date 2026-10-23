import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../../../../database/prisma/prisma.service.js';

interface PaymentAuthorizationPayload {
    sub: string;
    organizationId: string;
    subscriptionId: string;
    purpose: 'subscription-payment';
}

@Injectable()
export class PaymentAuthorizationService {
    private readonly tokenLifetimeSeconds = 300;

    private readonly tokenIssuer = 'promoapp-api';

    private readonly tokenAudience = 'promoapp-payment';

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {}

    /**
     * Genera una autorización temporal para pagar
     * una suscripción pendiente.
     *
     * Solo el propietario de la organización puede autorizar
     * el pago.
     *
     * Las renovaciones de suscripciones vencidas deben crear
     * una nueva suscripción PENDING, conservando la anterior
     * como historial.
     */
    async authorizePayment(
        userId: string,
        subscriptionId: string,
    ) {
        const subscription =
            await this.prisma.subscription.findUnique({
                where: {
                    id: subscriptionId,
                },
                select: {
                    id: true,
                    organizationId: true,
                    status: true,
                    plan: {
                        select: {
                            requiresPayment: true,
                            isActive: true,
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
            subscription.status !== 'PENDING' ||
            !subscription.plan.requiresPayment ||
            !subscription.plan.isActive
        ) {
            throw new ForbiddenException(
                'This subscription is not eligible for payment',
            );
        }

        const membership =
            await this.prisma.organizationMember.findUnique({
                where: {
                    userId_organizationId: {
                        userId,
                        organizationId:
                            subscription.organizationId,
                    },
                },
                select: {
                    role: true,
                },
            });

        if (!membership) {
            throw new ForbiddenException(
                'You do not belong to this organization',
            );
        }

        if (membership.role !== 'OWNER') {
            throw new ForbiddenException(
                'Only the organization owner can authorize subscription payments',
            );
        }

        const payload: PaymentAuthorizationPayload = {
            sub: userId,
            organizationId: subscription.organizationId,
            subscriptionId: subscription.id,
            purpose: 'subscription-payment',
        };

        const authorizationToken =
            await this.jwtService.signAsync(
                payload,
                {
                    expiresIn: this.tokenLifetimeSeconds,
                    issuer: this.tokenIssuer,
                    audience: this.tokenAudience,
                },
            );

        return {
            data: {
                authorizationToken,
                expiresInSeconds:
                    this.tokenLifetimeSeconds,
            },
        };
    }

    /**
     * Verifica la autorización antes de procesar un pago.
     *
     * Vuelve a validar los permisos y el estado actual de
     * la suscripción para evitar usar autorizaciones obsoletas.
     */
    async verifyPaymentAuthorization(
        token: string,
        subscriptionId: string,
    ): Promise<PaymentAuthorizationPayload> {
        if (
            typeof token !== 'string' ||
            token.trim().length === 0
        ) {
            throw new ForbiddenException(
                'Payment authorization is required',
            );
        }

        let payload: PaymentAuthorizationPayload;

        try {
            payload =
                await this.jwtService.verifyAsync<PaymentAuthorizationPayload>(
                    token,
                    {
                        issuer: this.tokenIssuer,
                        audience: this.tokenAudience,
                    },
                );
        } catch {
            throw new ForbiddenException(
                'Payment authorization is invalid or expired',
            );
        }

        if (
            !payload ||
            typeof payload.sub !== 'string' ||
            payload.sub.length === 0 ||
            typeof payload.organizationId !== 'string' ||
            payload.organizationId.length === 0 ||
            typeof payload.subscriptionId !== 'string' ||
            payload.subscriptionId !== subscriptionId ||
            payload.purpose !== 'subscription-payment'
        ) {
            throw new ForbiddenException(
                'Payment authorization does not match this subscription',
            );
        }

        const [membership, subscription] =
            await Promise.all([
                this.prisma.organizationMember.findUnique({
                    where: {
                        userId_organizationId: {
                            userId: payload.sub,
                            organizationId:
                                payload.organizationId,
                        },
                    },
                    select: {
                        role: true,
                    },
                }),

                this.prisma.subscription.findUnique({
                    where: {
                        id: subscriptionId,
                    },
                    select: {
                        organizationId: true,
                        status: true,
                        plan: {
                            select: {
                                requiresPayment: true,
                                isActive: true,
                            },
                        },
                    },
                }),
            ]);

        if (
            !membership ||
            membership.role !== 'OWNER'
        ) {
            throw new ForbiddenException(
                'The user is no longer authorized to pay',
            );
        }

        if (
            !subscription ||
            subscription.organizationId !==
                payload.organizationId ||
            subscription.status !== 'PENDING' ||
            !subscription.plan.requiresPayment ||
            !subscription.plan.isActive
        ) {
            throw new ForbiddenException(
                'The subscription is no longer eligible for payment',
            );
        }

        return payload;
    }
}