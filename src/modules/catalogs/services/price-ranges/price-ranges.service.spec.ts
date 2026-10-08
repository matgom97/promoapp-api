import { Test, TestingModule } from '@nestjs/testing';
import { PriceRangesService } from './price-ranges.service.js';

describe('PriceRangesService', () => {
  let service: PriceRangesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PriceRangesService],
    }).compile();

    service = module.get<PriceRangesService>(PriceRangesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
