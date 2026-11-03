import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../../common/authorization/authorization.module.js';
import { PlanAccessModule } from '../plan-access/plan-access.module.js';
import { PromotionsController } from './controllers/promotions.controller.js';
import { PromotionsService } from './services/promotions.service.js';
import { PromotionSchedulerService } from './services/promotion-scheduler.service.js';

@Module({
  imports: [AuthorizationModule, PlanAccessModule],
  controllers: [PromotionsController],
  providers: [PromotionsService, PromotionSchedulerService],
})
export class PromotionsModule {}
