import {
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';

import type {
  PlanAccessRepository,
} from '../../domain/interfaces/plan-access.repository.interface.js';

import {
  PLAN_ACCESS_REPOSITORY,
} from '../../plan-access.tokens.js';

@Injectable()
export class FeatureAccessService {
  constructor(
    @Inject(PLAN_ACCESS_REPOSITORY)
    private readonly planAccessRepository: PlanAccessRepository,
  ) {}

  async assertFeatureEnabled(
    organizationId: string,
    featureCode: string,
  ): Promise<void> {
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

    if (!plan.features.includes(featureCode)) {
      throw new ForbiddenException({
        code: 'FEATURE_NOT_AVAILABLE',
        message:
          'La funcionalidad no está incluida en el plan contratado.',
        feature: featureCode,
        plan: plan.planCode,
      });
    }
  }
}