import { Test, TestingModule } from '@nestjs/testing';
import { WompiWebhookService } from './wompi-webhook.service.js';

describe('WompiWebhookService', () => {
  let service: WompiWebhookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WompiWebhookService],
    }).compile();

    service = module.get<WompiWebhookService>(WompiWebhookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
