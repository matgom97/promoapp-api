import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';

import { PaymentAuthorizationModule } from './services/payment-authorization/payment-authorization.module.js';

import { WompiService } from './services/wompi/wompi.service.js';

import { PaymentsService } from './services/payments/payments.service.js';

import { PaymentsController } from './controllers/payments/payments.controller.js';

import { WompiWebhookController } from './controllers/wompi-webhook/wompi-webhook.controller.js';

import { WompiWebhookService } from './services/wompi-webhook/wompi-webhook/wompi-webhook.service.js';

@Module({
  imports: [
    AuthModule,
    PaymentAuthorizationModule,
  ],

  providers: [
    WompiService,
    PaymentsService,
    WompiWebhookService,
  ],

  controllers: [
    PaymentsController,
    WompiWebhookController,
  ],
})
export class PaymentsModule {}