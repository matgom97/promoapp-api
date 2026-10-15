import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../../database/prisma/prisma.service.js';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Recupera la suscripción pendiente de la organización
   * del usuario autenticado.
   *
   * Solo el OWNER puede gestionar el pago.
   */
  async findMyPending(userId: string) {
    const membership =
      await this.prisma.organizationMember.findFirst({
        where: {
          userId,
          role: 'OWNER',
        },
        select: {
          organizationId: true,
        },
      });

    if (!membership) {
      throw new ForbiddenException(
        'Only the organization owner can manage subscription payments',
      );
    }

    const subscription =
      await this.prisma.subscription.findFirst({
        where: {
          organizationId: membership.organizationId,
          status: 'PENDING',
          plan: {
            requiresPayment: true,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          plan: {
            select: {
              id: true,
              code: true,
              name: true,
              description: true,
              priceAmount: true,
              currency: true,
              billingInterval: true,
              requiresPayment: true,
              features: {
                where: {
                  feature: {
                    isActive: true,
                  },
                },
                select: {
                  feature: {
                    select: {
                      code: true,
                      name: true,
                      description: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!subscription) {
      throw new NotFoundException(
        'No pending subscription requiring payment was found',
      );
    }

    return this.formatSubscription(subscription);
  }

  /**
   * Obtiene una suscripción específica siempre que
   * el usuario pertenezca a su organización.
   */
  async findById(
    subscriptionId: string,
    userId: string,
  ) {
    const subscription =
      await this.prisma.subscription.findFirst({
        where: {
          id: subscriptionId,
          organization: {
            members: {
              some: {
                userId,
              },
            },
          },
        },
        include: {
          plan: {
            select: {
              id: true,
              code: true,
              name: true,
              description: true,
              priceAmount: true,
              currency: true,
              billingInterval: true,
              requiresPayment: true,
              features: {
                where: {
                  feature: {
                    isActive: true,
                  },
                },
                select: {
                  feature: {
                    select: {
                      code: true,
                      name: true,
                      description: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!subscription) {
      throw new NotFoundException(
        'Subscription not found',
      );
    }

    return this.formatSubscription(subscription);
  }

  /**
   * Normaliza la respuesta para ambos endpoints.
   */
  private formatSubscription(subscription: any) {
    return {
      data: {
        id: subscription.id,
        status: subscription.status,

        startsAt: subscription.startsAt,

        currentPeriodStart:
          subscription.currentPeriodStart,

        currentPeriodEnd:
          subscription.currentPeriodEnd,

        canceledAt: subscription.canceledAt,

        plan: {
          id: subscription.plan.id,
          code: subscription.plan.code,
          name: subscription.plan.name,
          description: subscription.plan.description,

          priceAmount:
            subscription.plan.priceAmount.toString(),

          currency: subscription.plan.currency,

          billingInterval:
            subscription.plan.billingInterval,

          requiresPayment:
            subscription.plan.requiresPayment,

          features: subscription.plan.features.map(
            ({ feature }: any) => ({
              code: feature.code,
              name: feature.name,
              description: feature.description,
            }),
          ),
        },
      },
    };
  }
}