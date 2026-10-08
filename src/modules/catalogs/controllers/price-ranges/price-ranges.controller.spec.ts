import { Test, TestingModule } from '@nestjs/testing';
import { PriceRangesController } from './price-ranges.controller.js';

describe('PriceRangesController', () => {
  let controller: PriceRangesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PriceRangesController],
    }).compile();

    controller = module.get<PriceRangesController>(PriceRangesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
