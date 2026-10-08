import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../../database/prisma/prisma.service.js';

@Injectable()
export class SubscriptionsService {

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findById(
    subscriptionId: string,
    userId: string,
  ) {

    const subscription =
      await this.prisma.subscription.findFirst({
        where: {
          id: subscriptionId,

          restaurant: {
            memberships: {
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
              trialDays: true,
              requiresPayment: true,

              features: {
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

    return {
      data: {
        id: subscription.id,
        status: subscription.status,

        startsAt:
          subscription.startsAt,

        trialEndsAt:
          subscription.trialEndsAt,

        currentPeriodStart:
          subscription.currentPeriodStart,

        currentPeriodEnd:
          subscription.currentPeriodEnd,

        canceledAt:
          subscription.canceledAt,

        plan: {
          id: subscription.plan.id,

          code:
            subscription.plan.code,

          name:
            subscription.plan.name,

          description:
            subscription.plan.description,

          priceAmount:
            subscription.plan.priceAmount.toString(),

          currency:
            subscription.plan.currency,

          billingInterval:
            subscription.plan.billingInterval,

          trialDays:
            subscription.plan.trialDays,

          requiresPayment:
            subscription.plan.requiresPayment,

          features:
            subscription.plan.features.map(
              ({ feature }) => ({
                code: feature.code,
                name: feature.name,
                description:
                  feature.description,
              }),
            ),
        },
      },
    };
  }
}