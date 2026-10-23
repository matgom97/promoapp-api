import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import {
  REQUIRED_FEATURES_KEY,
} from '../decorators/require-features.decorator.js';

import {
  FeatureAccessService,
} from '../application/services/feature-access.service.js';

interface AuthenticatedUser {
  userId: string;
  email: string;
}

interface WorkspaceAuthorization {
  restaurantId: string;
  organizationId: string;
  permissions: string[];
}

interface AuthorizedRequest extends Request {
  user?: AuthenticatedUser;
  workspaceAuthorization?: WorkspaceAuthorization;
}

@Injectable()
export class PlanFeaturesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly featureAccessService: FeatureAccessService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const requiredFeatures =
      this.reflector.getAllAndOverride<string[]>(
        REQUIRED_FEATURES_KEY,
        [context.getHandler(), context.getClass()],
      );

    // Los endpoints sin funcionalidades declaradas
    // no requieren esta comprobación.
    if (!requiredFeatures?.length) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<AuthorizedRequest>();

    if (!request.user?.userId) {
      throw new UnauthorizedException(
        'User is not authenticated',
      );
    }

    const workspace = request.workspaceAuthorization;

    if (!workspace) {
      throw new ForbiddenException(
        'Workspace authorization context is missing',
      );
    }

    for (const feature of requiredFeatures) {
      await this.featureAccessService.assertFeatureEnabled(
        workspace.organizationId,
        feature,
      );
    }

    return true;
  }
}