import { Controller, Get, Version } from '@nestjs/common';
import { PlansService } from '../../services/plans/plans.service.js';


@Controller('plans')
export class PlansController {
  constructor(
    private readonly plansService: PlansService,
  ) {}

  @Get()
  @Version('1')
  async findAll() {
    const plans = await this.plansService.findAll();

    return {
      data: plans,
    };
  }
}