import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Delete,
  Req,
  UnauthorizedException,
  UseGuards,
  Version,
} from '@nestjs/common';

import type { Request } from 'express';

import { SubscriptionsService } from '../../services/subscriptions/subscriptions.service.js';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth/jwt-auth.guard.js';

interface AuthenticatedRequest extends Request {
  user?: {
    userId?: string;
  };
}

interface CreateSubscriptionDto {
  planId: string;
}

interface SchedulePlanChangeDto {
  planId: string;
}

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  /**
   * Recupera la suscripción pendiente del propietario.
   */
  @Get('me/pending')
  @Version('1')
  findMyPending(
    @Req() request: AuthenticatedRequest,
  ) {
    const userId = this.getAuthenticatedUserId(request);

    return this.subscriptionsService.findMyPending(userId);
  }

  /**
   * Consulta la suscripción activa del propietario.
   */
  @Get('me/active')
  @Version('1')
  findMyActive(
    @Req() request: AuthenticatedRequest,
  ) {
    const userId = this.getAuthenticatedUserId(request);

    return this.subscriptionsService.findMyActive(userId);
  }

  /**
   * Crea una suscripción pendiente para el plan seleccionado.
   */
  @Post()
  @Version('1')
  create(
    @Body() dto: CreateSubscriptionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const userId = this.getAuthenticatedUserId(request);

    return this.subscriptionsService.createForSelectedPlan(
      userId,
      dto.planId,
    );
  }

  /**
   * Programa un cambio de plan para el siguiente período.
   *
   * No genera un cobro inmediato.
   */
  @Post(':subscriptionId/schedule-plan-change')
  @Version('1')
  schedulePlanChange(
    @Param('subscriptionId') subscriptionId: string,
    @Body() dto: SchedulePlanChangeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const userId = this.getAuthenticatedUserId(request);

    return this.subscriptionsService.schedulePlanChange(
      userId,
      subscriptionId,
      dto.planId,
    );
  }

  /**
   * Cancela un cambio de plan programado.
   */
  @Delete(':subscriptionId/scheduled-plan-change')
  @Version('1')
  cancelScheduledPlanChange(
    @Param('subscriptionId') subscriptionId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const userId = this.getAuthenticatedUserId(request);

    return this.subscriptionsService.cancelScheduledPlanChange(
      userId,
      subscriptionId,
    );
  }

  /**
   * Consulta una suscripción específica.
   */
  @Get(':subscriptionId')
  @Version('1')
  findById(
    @Param('subscriptionId') subscriptionId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const userId = this.getAuthenticatedUserId(request);

    return this.subscriptionsService.findById(
      subscriptionId,
      userId,
    );
  }

  /**
   * Extrae el usuario autenticado de la solicitud.
   */
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