import { Controller, Get, Version } from '@nestjs/common';
import { PriceRangesService } from '../../services/price-ranges/price-ranges.service.js';

@Controller('price-ranges')
export class PriceRangesController {
  constructor(
    private readonly priceRangesService: PriceRangesService,
  ) {}

  @Get()
  @Version('1')
  async findAll() {
    const priceRanges =
      await this.priceRangesService.findAll();

    return {
      data: priceRanges,
    };
  }
}