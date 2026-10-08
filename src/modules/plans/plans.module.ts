import { Module } from '@nestjs/common';
import { PlansController } from './controllers/plans/plans.controller.js';
import { PlansService } from './services/plans/plans.service.js';

@Module({
  controllers: [PlansController],
  providers: [PlansService]
})
export class PlansModule {}
