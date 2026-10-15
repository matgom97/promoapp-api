import { Test, TestingModule } from '@nestjs/testing';
import { PaymentAuthorizationService } from './payment-authorization.service.js';

describe('PaymentAuthorizationService', () => {
  let service: PaymentAuthorizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentAuthorizationService],
    }).compile();

    service = module.get<PaymentAuthorizationService>(PaymentAuthorizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
