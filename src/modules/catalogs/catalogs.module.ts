import { Module } from '@nestjs/common';
import { CuisinesController } from './controllers/cuisines/cuisines.controller.js';
import { CuisinesService } from './services/cuisines/cuisines.service.js';
import { PriceRangesController } from './controllers/price-ranges/price-ranges.controller.js';
import { PriceRangesService } from './services/price-ranges/price-ranges.service.js';

@Module({
  controllers: [CuisinesController, PriceRangesController],
  providers: [CuisinesService, PriceRangesService]
})
export class CatalogsModule {}
