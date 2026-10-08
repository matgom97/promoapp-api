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

@Controller('subscriptions')
export class SubscriptionsController {

  constructor(
    private readonly subscriptionsService:
      SubscriptionsService,
  ) {}

  @Get(':subscriptionId')
  @Version('1')
  @UseGuards(JwtAuthGuard)
  findById(
    @Param('subscriptionId')
    subscriptionId: string,

    @Req()
    request: Request,
  ) {

    const user = request.user as {
      userId?: string;
    };

    if (!user?.userId) {
      throw new UnauthorizedException(
        'User is not authenticated',
      );
    }

    return this.subscriptionsService.findById(
      subscriptionId,
      user.userId,
    );
  }
}