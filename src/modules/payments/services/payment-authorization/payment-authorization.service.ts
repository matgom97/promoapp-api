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
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {}

    /**
     * Genera una autorización temporal para iniciar
     * el pago de una suscripción.
     *
     * Por ahora, únicamente el OWNER puede autorizar
     * el pago. La delegación a otros usuarios requiere
     * almacenar una autorización explícita en backend.
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
            !subscription.plan.requiresPayment
        ) {
            throw new ForbiddenException(
                'This subscription does not require a pending payment',
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
                    expiresIn: '5m',
                    issuer: 'promoapp-api',
                    audience: 'promoapp-payment',
                },
            );

        return {
            data: {
                authorizationToken,
                expiresInSeconds: 300,
            },
        };
    }

    /**
     * Verifica la autorización antes de procesar
     * una solicitud de pago.
     */
    async verifyPaymentAuthorization(
        token: string,
        subscriptionId: string,
    ): Promise<PaymentAuthorizationPayload> {
        let payload: PaymentAuthorizationPayload;

        try {
            payload =
                await this.jwtService.verifyAsync<PaymentAuthorizationPayload>(
                    token,
                    {
                        issuer: 'promoapp-api',
                        audience: 'promoapp-payment',
                    },
                );
        } catch {
            throw new ForbiddenException(
                'Payment authorization is invalid or expired',
            );
        }

        if (
            payload.purpose !== 'subscription-payment' ||
            !payload.sub ||
            !payload.organizationId ||
            payload.subscriptionId !== subscriptionId
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
            !subscription.plan.requiresPayment
        ) {
            throw new ForbiddenException(
                'The subscription is no longer eligible for payment',
            );
        }

        return payload;
    }
}