import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service.js';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const plans = await this.prisma.plan.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        priceAmount: true,
        currency: true,
        billingInterval: true,
        trialDays: true,
        maxUsers: true,
        maxActivePromotions: true,
        maxRestaurants: true,
        requiresPayment: true,
        isFeatured: true,

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
    });

    return plans.map((plan) => ({
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,

      price: {
        amount: Number(plan.priceAmount),
        currency: plan.currency,
      },

      billingInterval: plan.billingInterval,
      trialDays: plan.trialDays,

      limits: {
        maxUsers: plan.maxUsers,
        maxActivePromotions: plan.maxActivePromotions,
        maxRestaurants: plan.maxRestaurants,
      },

      requiresPayment: plan.requiresPayment,
      isFeatured: plan.isFeatured,

      features: plan.features.map(({ feature }) => ({
        code: feature.code,
        name: feature.name,
        description: feature.description,
      })),
    }));
  }
}