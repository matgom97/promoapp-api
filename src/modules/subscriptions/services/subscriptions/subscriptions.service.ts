import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, SubscriptionStatus } from '@prisma/client';

import { PrismaService } from '../../../../database/prisma/prisma.service.js';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private readonly planInclude = {
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
  } satisfies Prisma.PlanInclude;

  /**
   * Busca la suscripción pendiente que debe pagar el propietario.
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
            include: this.planInclude,
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
   * Consulta una suscripción a la que pertenece el usuario.
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
            include: this.planInclude,
          },
          scheduledPlan: {
            include: this.planInclude,
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
   * Consulta la suscripción activa vigente de la organización.
   */
  async findMyActive(userId: string) {
    const organizationId =
      await this.getOwnerOrganizationId(userId);

    const now = new Date();

    const subscription =
      await this.prisma.subscription.findFirst({
        where: {
          organizationId,
          status: 'ACTIVE',
          currentPeriodEnd: {
            gt: now,
          },
        },
        orderBy: {
          currentPeriodEnd: 'desc',
        },
        include: {
          plan: {
            include: this.planInclude,
          },
          scheduledPlan: {
            include: this.planInclude,
          },
        },
      });

    if (!subscription) {
      throw new NotFoundException(
        'No active subscription was found',
      );
    }

    return this.formatSubscription(subscription);
  }

  /**
   * Programa un cambio de plan para el siguiente período.
   *
   * No modifica el plan actual ni genera un cobro inmediato.
   */
  async schedulePlanChange(
    userId: string,
    subscriptionId: string,
    newPlanId: string,
  ) {
    if (!newPlanId?.trim()) {
      throw new BadRequestException(
        'A valid plan ID is required',
      );
    }

    const organizationId =
      await this.getOwnerOrganizationId(userId);

    return this.prisma.$transaction(async (tx) => {
      await this.lockOrganization(tx, organizationId);

      const subscription =
        await tx.subscription.findFirst({
          where: {
            id: subscriptionId,
            organizationId,
          },
          include: {
            plan: true,
            scheduledPlan: true,
          },
        });

      if (!subscription) {
        throw new NotFoundException(
          'Subscription not found',
        );
      }

      if (
        subscription.status !== 'ACTIVE' ||
        !subscription.currentPeriodEnd ||
        subscription.currentPeriodEnd <= new Date()
      ) {
        throw new ConflictException(
          'Only an active subscription with a valid billing period can schedule a plan change',
        );
      }

      if (
        subscription.planId === newPlanId
      ) {
        throw new BadRequestException(
          'The selected plan is already the current plan',
        );
      }

      if (
        subscription.scheduledPlanId === newPlanId
      ) {
        throw new ConflictException(
          'This plan change is already scheduled',
        );
      }

      const newPlan = await tx.plan.findFirst({
        where: {
          id: newPlanId,
          isActive: true,
        },
      });

      if (!newPlan) {
        throw new NotFoundException(
          'The selected plan does not exist or is inactive',
        );
      }

      if (!newPlan.requiresPayment) {
        throw new BadRequestException(
          'The selected plan is not available through paid subscription checkout',
        );
      }

      const updated =
        await tx.subscription.update({
          where: {
            id: subscription.id,
          },
          data: {
            scheduledPlanId: newPlan.id,
          },
          include: {
            plan: {
              include: this.planInclude,
            },
            scheduledPlan: {
              include: this.planInclude,
            },
          },
        });

      return {
        message:
          'Plan change scheduled for the next billing period',
        data: this.formatSubscription(updated),
      };
    });
  }

  /**
   * Cancela un cambio de plan programado.
   * El plan actual permanece intacto.
   */
  async cancelScheduledPlanChange(
    userId: string,
    subscriptionId: string,
  ) {
    const organizationId =
      await this.getOwnerOrganizationId(userId);

    return this.prisma.$transaction(async (tx) => {
      await this.lockOrganization(tx, organizationId);

      const subscription =
        await tx.subscription.findFirst({
          where: {
            id: subscriptionId,
            organizationId,
          },
          select: {
            id: true,
            status: true,
            scheduledPlanId: true,
          },
        });

      if (!subscription) {
        throw new NotFoundException(
          'Subscription not found',
        );
      }

      if (subscription.status !== 'ACTIVE') {
        throw new ConflictException(
          'Only active subscriptions can cancel a scheduled plan change',
        );
      }

      if (!subscription.scheduledPlanId) {
        throw new ConflictException(
          'There is no scheduled plan change to cancel',
        );
      }

      const updated =
        await tx.subscription.update({
          where: {
            id: subscription.id,
          },
          data: {
            scheduledPlanId: null,
          },
          include: {
            plan: {
              include: this.planInclude,
            },
            scheduledPlan: {
              include: this.planInclude,
            },
          },
        });

      return {
        message: 'Scheduled plan change canceled',
        data: this.formatSubscription(updated),
      };
    });
  }

  /**
   * Crea una suscripción pendiente para el plan seleccionado.
   *
   * Nunca reutiliza suscripciones vencidas.
   */
  async createForSelectedPlan(
    userId: string,
    planId: string,
  ) {
    if (!planId?.trim()) {
      throw new BadRequestException(
        'A valid plan ID is required',
      );
    }

    const membership =
      await this.prisma.organizationMember.findFirst({
        where: {
          userId,
          role: 'OWNER',
        },
        select: {
          organizationId: true,
          organization: {
            select: {
              restaurants: {
                where: {
                  status: 'ACTIVE',
                },
                orderBy: {
                  createdAt: 'asc',
                },
                take: 1,
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

    if (!membership) {
      throw new ForbiddenException(
        'Only the organization owner can manage subscriptions',
      );
    }

    const restaurant =
      membership.organization.restaurants[0];

    if (!restaurant) {
      throw new NotFoundException(
        'No active restaurant was found for this organization',
      );
    }

    const plan = await this.prisma.plan.findFirst({
      where: {
        id: planId,
        isActive: true,
      },
      select: {
        id: true,
        requiresPayment: true,
      },
    });

    if (!plan) {
      throw new NotFoundException(
        'The selected plan does not exist or is inactive',
      );
    }

    if (!plan.requiresPayment) {
      throw new BadRequestException(
        'This plan does not require payment and cannot use paid checkout',
      );
    }

    const now = new Date();

    const result = await this.prisma.$transaction(
      async (tx) => {
        await this.lockOrganization(
          tx,
          membership.organizationId,
        );

        const activeSubscription =
          await tx.subscription.findFirst({
            where: {
              organizationId:
                membership.organizationId,
              status: 'ACTIVE',
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
            'The organization already has an active subscription. Schedule a plan change instead.',
          );
        }

        const pendingSubscription =
          await tx.subscription.findFirst({
            where: {
              organizationId:
                membership.organizationId,
              restaurantId: restaurant.id,
              status: 'PENDING',
              plan: {
                requiresPayment: true,
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            select: {
              id: true,
              status: true,
              planId: true,
            },
          });

        if (pendingSubscription) {
          if (
            pendingSubscription.planId === plan.id
          ) {
            return {
              id: pendingSubscription.id,
              status: pendingSubscription.status,
              reused: true,
            };
          }

          throw new ConflictException(
            'Another pending subscription exists for a different plan. Resolve its payment before selecting another plan.',
          );
        }

        const subscription =
          await tx.subscription.create({
            data: {
              organizationId:
                membership.organizationId,
              restaurantId: restaurant.id,
              planId: plan.id,
              status: 'PENDING',
              startsAt: now,
            },
            select: {
              id: true,
              status: true,
            },
          });

        return {
          id: subscription.id,
          status: subscription.status,
          reused: false,
        };
      },
    );

    return {
      message: result.reused
        ? 'Existing pending subscription retrieved'
        : 'Subscription created successfully',
      data: result,
    };
  }

  /**
   * Obtiene la organización del propietario.
   */
  private async getOwnerOrganizationId(
    userId: string,
  ): Promise<string> {
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
        'Only the organization owner can manage subscriptions',
      );
    }

    return membership.organizationId;
  }

  /**
   * Serializa las operaciones de suscripción por organización.
   *
   * El nombre físico de la tabla se toma del @@map del esquema.
   */
  private async lockOrganization(
    tx: Prisma.TransactionClient,
    organizationId: string,
  ): Promise<void> {
    const organizations = await tx.$queryRaw<
      { id: string }[]
    >`
      SELECT id
      FROM organizations
      WHERE id = ${organizationId}
      FOR UPDATE
    `;

    if (organizations.length === 0) {
      throw new NotFoundException(
        'Organization not found',
      );
    }
  }

  /**
   * Convierte BigInt a string para respuestas JSON.
   */
  private formatSubscription(subscription: any) {
    return {
      data: {
        id: subscription.id,
        status: subscription.status,
        startsAt: subscription.startsAt,
        trialEndsAt: subscription.trialEndsAt,
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

        scheduledPlan: subscription.scheduledPlan
          ? {
              id: subscription.scheduledPlan.id,
              code: subscription.scheduledPlan.code,
              name: subscription.scheduledPlan.name,
              description:
                subscription.scheduledPlan.description,
              priceAmount:
                subscription.scheduledPlan.priceAmount.toString(),
              currency:
                subscription.scheduledPlan.currency,
              billingInterval:
                subscription.scheduledPlan.billingInterval,
              requiresPayment:
                subscription.scheduledPlan.requiresPayment,
              features:
                subscription.scheduledPlan.features.map(
                  ({ feature }: any) => ({
                    code: feature.code,
                    name: feature.name,
                    description: feature.description,
                  }),
                ),
            }
          : null,
      },
    };
  }
}