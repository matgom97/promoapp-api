import { Module } from '@nestjs/common';

import { SubscriptionsController } from './controllers/subscriptions/subscriptions.controller.js';
import { SubscriptionsService } from './services/subscriptions/subscriptions.service.js';
import { SubscriptionRenewalService } from './services/subscription-renewal/subscription-renewal.service.js';
import { SubscriptionRenewalJobService } from './services/subscription-renewal-job/subscription-renewal-job/subscription-renewal-job.service.js';

@Module({
  controllers: [
    SubscriptionsController,
  ],
  providers: [
    SubscriptionsService,
    SubscriptionRenewalService,
    SubscriptionRenewalJobService,
  ],
  exports: [
    SubscriptionsService,
    SubscriptionRenewalService,
  ],
})
export class SubscriptionsModule {}