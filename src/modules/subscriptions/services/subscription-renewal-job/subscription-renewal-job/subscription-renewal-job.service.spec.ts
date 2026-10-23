import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionRenewalJobService } from './subscription-renewal-job.service.js';

describe('SubscriptionRenewalJobService', () => {
  let service: SubscriptionRenewalJobService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubscriptionRenewalJobService],
    }).compile();

    service = module.get<SubscriptionRenewalJobService>(SubscriptionRenewalJobService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
