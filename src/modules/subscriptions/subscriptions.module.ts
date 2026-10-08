import { Module } from '@nestjs/common';
import { SubscriptionsController } from './controllers/subscriptions/subscriptions.controller.js';
import { SubscriptionsService } from './services/subscriptions/subscriptions.service.js';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService]
})
export class SubscriptionsModule {}
