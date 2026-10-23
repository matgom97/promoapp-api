import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';
import { RestaurantsService } from './restaurants.service.js';



@Controller({
  path: 'organizations/:organizationId/restaurants',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class RestaurantsController {
  constructor(
    private readonly restaurantsService: RestaurantsService,
  ) {}

  @Get()
  findAll(
    @Param('organizationId') organizationId: string,
  ) {
    
    return this.restaurantsService.findAllByOrganization(
      organizationId,
    );
  }
}