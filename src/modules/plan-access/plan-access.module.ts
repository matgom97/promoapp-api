import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma/prisma.module.js';

import {
  FeatureAccessService,
} from './application/services/feature-access.service.js';

import {
  PlanLimitsService,
} from './application/services/plan-limits.service.js';

import {
  PrismaPlanAccessRepository,
} from './infrastructure/repositories/prisma-plan-access.repository.js';

import {
  PLAN_ACCESS_REPOSITORY,
} from './plan-access.tokens.js';

import {
  PlanFeaturesGuard,
} from './guards/plan-features.guard.js';

@Module({
  imports: [PrismaModule],

  providers: [
    {
      provide: PLAN_ACCESS_REPOSITORY,
      useClass: PrismaPlanAccessRepository,
    },
    FeatureAccessService,
    PlanLimitsService,
    PlanFeaturesGuard,
  ],

  exports: [
    FeatureAccessService,
    PlanLimitsService,
    PlanFeaturesGuard,
  ],
})
export class PlanAccessModule {}