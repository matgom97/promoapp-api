import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Version,
} from '@nestjs/common';
import { WompiWebhookService } from '../../services/wompi-webhook/wompi-webhook/wompi-webhook.service.js';



interface WompiWebhookPayload {
  event: string;

  data: {
    transaction: {
      id: string;
      reference: string;
      amount_in_cents: number;
      currency: string;
      status: string;
    };
  };

  environment: 'test' | 'prod';

  signature: {
    properties: string[];
    checksum: string;
  };

  timestamp: number;

  sent_at?: string;
}

@Controller('payments/wompi')
export class WompiWebhookController {
  constructor(
    private readonly wompiWebhookService: WompiWebhookService,
  ) {}

  @Post('webhook')
  @Version('1')
  @HttpCode(200)
  async handleWebhook(
    @Body() body: WompiWebhookPayload,
    @Headers('x-event-checksum')
    checksum?: string,
  ) {
    return this.wompiWebhookService.processTransactionUpdated(
      body,
      checksum,
    );
  }
}