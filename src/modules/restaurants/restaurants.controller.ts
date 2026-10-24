import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';

import { RestaurantsService } from './restaurants.service.js';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

@Controller({
  path: 'restaurants',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class RestaurantsController {
  constructor(
    private readonly restaurantsService: RestaurantsService,
  ) {}

  @Get('organizations/:organizationId')
  async findAllByOrganization(
    @Req() request: AuthenticatedRequest,
    @Param('organizationId') organizationId: string,
  ) {
    const userId = request.user?.userId;

    if (!userId) {
      const {
        UnauthorizedException,
      } = await import('@nestjs/common');

      throw new UnauthorizedException(
        'User is not authenticated',
      );
    }

    const restaurants =
      await this.restaurantsService.findAllByOrganization(
        userId,
        organizationId,
      );

    return {
      message: 'Restaurants retrieved successfully',
      data: restaurants,
    };
  }
}