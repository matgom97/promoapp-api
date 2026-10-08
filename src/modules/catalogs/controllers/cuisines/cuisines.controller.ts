import { Controller, Get, Version } from '@nestjs/common';
import { CuisinesService } from '../../services/cuisines/cuisines.service.js';


@Controller('cuisines')
export class CuisinesController {
  constructor(
    private readonly cuisinesService: CuisinesService,
  ) {}

  @Get()
  @Version('1')
  async findAll() {
    const cuisines = await this.cuisinesService.findAll();

    return {
      data: cuisines,
    };
  }
}