import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../database/prisma/prisma.service.js';

import {
  OrganizationPlanAccess,
  PlanAccessRepository,
} from '../../domain/interfaces/plan-access.repository.interface.js';

@Injectable()
export class PrismaPlanAccessRepository implements PlanAccessRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findActiveOrganizationPlan(
    organizationId: string,
  ): Promise<OrganizationPlanAccess | null> {
    const now = new Date();

    const subscription = await this.prisma.subscription.findFirst({
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
      select: {
        id: true,
        plan: {
          select: {
            id: true,
            code: true,
            name: true,
            maxUsers: true,
            maxActivePromotions: true,
            maxRestaurants: true,
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
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!subscription) {
      return null;
    }

    return {
      subscriptionId: subscription.id,
      planId: subscription.plan.id,
      planCode: subscription.plan.code,
      planName: subscription.plan.name,

      features: subscription.plan.features.map(
        (planFeature) => planFeature.feature.code,
      ),

      limits: {
        maxUsers: subscription.plan.maxUsers,
        maxActivePromotions:
          subscription.plan.maxActivePromotions,
        maxRestaurants: subscription.plan.maxRestaurants,
      },
    };
  }
}