import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth/jwt-auth.guard.js';
import { RestaurantsService } from '../services/restaurants.service.js';
import { CreateRestaurantDto } from '../dto/create-restaurant.dto.js';
import { UpdateRestaurantDto } from '../dto/update-restaurant.dto.js';
import { UpdateRestaurantStatusDto } from '../dto/update-restaurant-status.dto.js';


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

  /**
   * Endpoint existente.
   *
   * Se conserva para la pantalla de usuarios.
   */
  @Get('organizations/:organizationId')
  async findAllByOrganization(
    @Req() request: AuthenticatedRequest,
    @Param('organizationId') organizationId: string,
  ) {
    const userId = this.getAuthenticatedUserId(request);

    const restaurants =
      await this.restaurantsService.findAllByOrganization(
        userId,
        organizationId,
      );

    return {
      message: 'Restaurants retrieved successfullySSS',
      data: restaurants,
    };
  }

  /**
   * Consultar el detalle de una sede.
   */
  @Get(':restaurantId')
  async findOne(
    @Req() request: AuthenticatedRequest,
    @Param('restaurantId') restaurantId: string,
  ) {
    const userId = this.getAuthenticatedUserId(request);

    const restaurant =
      await this.restaurantsService.findOne(
        userId,
        restaurantId,
      );

    return {
      message: 'Restaurant retrieved successfully',
      data: restaurant,
    };
  }

  /**
   * Crear una sede dentro de una organización.
   */
  @Post('organizations/:organizationId')
  async create(
    @Req() request: AuthenticatedRequest,
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateRestaurantDto,
  ) {
    const userId = this.getAuthenticatedUserId(request);

    const restaurant =
      await this.restaurantsService.create(
        userId,
        organizationId,
        dto,
      );

    return {
      message: 'Restaurant created successfully',
      data: restaurant,
    };
  }

  /**
   * Actualizar los datos de una sede.
   */
  @Patch(':restaurantId')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('restaurantId') restaurantId: string,
    @Body() dto: UpdateRestaurantDto,
  ) {
    const userId = this.getAuthenticatedUserId(request);

    const restaurant =
      await this.restaurantsService.update(
        userId,
        restaurantId,
        dto,
      );

    return {
      message: 'Restaurant updated successfully',
      data: restaurant,
    };
  }

  /**
   * Activar o desactivar una sede.
   */
  @Patch(':restaurantId/status')
  async updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param('restaurantId') restaurantId: string,
    @Body() dto: UpdateRestaurantStatusDto,
  ) {
    const userId = this.getAuthenticatedUserId(request);

    const restaurant =
      await this.restaurantsService.updateStatus(
        userId,
        restaurantId,
        dto,
      );

    return {
      message: 'Restaurant status updated successfully',
      data: restaurant,
    };
  }

  private getAuthenticatedUserId(
    request: AuthenticatedRequest,
  ): string {
    const userId = request.user?.userId;

    if (!userId) {
      throw new UnauthorizedException(
        'User is not authenticated',
      );
    }

    return userId;
  }
}