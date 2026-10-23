import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionRenewalService } from './subscription-renewal.service.js';

describe('SubscriptionRenewalService', () => {
  let service: SubscriptionRenewalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubscriptionRenewalService],
    }).compile();

    service = module.get<SubscriptionRenewalService>(SubscriptionRenewalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
