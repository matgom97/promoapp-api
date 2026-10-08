import { Module } from '@nestjs/common';
import { WompiService } from './services/wompi/wompi.service.js';
import { PaymentsService } from './services/payments/payments.service.js';
import { PaymentsController } from './controllers/payments/payments.controller.js';
import { WompiWebhookController } from './controllers/wompi-webhook/wompi-webhook.controller.js';
import { WompiWebhookService } from './services/wompi-webhook/wompi-webhook/wompi-webhook.service.js';

@Module({
  providers: [WompiService, PaymentsService, WompiWebhookService],
  controllers: [PaymentsController, WompiWebhookController]
})
export class PaymentsModule {}
