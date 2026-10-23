import {
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';

import type {
  OrganizationPlanAccess,
  PlanAccessRepository,
} from '../../domain/interfaces/plan-access.repository.interface.js';

import {
  PLAN_ACCESS_REPOSITORY,
} from '../../plan-access.tokens.js';

export type PlanLimit =
  | 'maxUsers'
  | 'maxActivePromotions'
  | 'maxRestaurants';

@Injectable()
export class PlanLimitsService {
  constructor(
    @Inject(PLAN_ACCESS_REPOSITORY)
    private readonly planAccessRepository: PlanAccessRepository,
  ) {}

  async getOrganizationPlan(
    organizationId: string,
  ): Promise<OrganizationPlanAccess> {
    const plan =
      await this.planAccessRepository.findActiveOrganizationPlan(
        organizationId,
      );

    if (!plan) {
      throw new ForbiddenException({
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'La organización no tiene una suscripción activa.',
      });
    }

    return plan;
  }

  async getOrganizationLimits(
    organizationId: string,
  ): Promise<OrganizationPlanAccess['limits']> {
    const plan = await this.getOrganizationPlan(organizationId);

    return plan.limits;
  }

  async assertLimitNotReached(
    organizationId: string,
    limitName: PlanLimit,
    currentCount: number,
  ): Promise<void> {
    const plan = await this.getOrganizationPlan(organizationId);

    const limit = plan.limits[limitName];

    if (limit === null) {
      return;
    }

    if (currentCount >= limit) {
      throw new ForbiddenException({
        code: 'PLAN_LIMIT_REACHED',
        message: 'La organización alcanzó el límite de su plan.',
        limit: limitName,
        maximum: limit,
        current: currentCount,
        plan: plan.planCode,
      });
    }
  }
}