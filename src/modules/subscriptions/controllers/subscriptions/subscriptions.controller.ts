import {
  Controller,
  Get,
  Param,
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

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  /**
   * Obtiene la suscripción pendiente de la organización
   * del usuario autenticado.
   */
  @Get('me/pending')
  @Version('1')
  findMyPending(
    @Req() request: AuthenticatedRequest,
  ) {
    const userId = request.user?.userId;

    if (!userId) {
      throw new UnauthorizedException(
        'User is not authenticated',
      );
    }

    return this.subscriptionsService.findMyPending(userId);
  }

  /**
   * Obtiene una suscripción específica.
   */
  @Get(':subscriptionId')
  @Version('1')
  findById(
    @Param('subscriptionId') subscriptionId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const userId = request.user?.userId;

    if (!userId) {
      throw new UnauthorizedException(
        'User is not authenticated',
      );
    }

    return this.subscriptionsService.findById(
      subscriptionId,
      userId,
    );
  }
}