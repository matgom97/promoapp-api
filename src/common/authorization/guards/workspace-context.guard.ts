import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import type { Request } from 'express';

import {
  WorkspaceAuthorizationService,
} from '../services/workspace-authorization.service.js';

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
export class WorkspaceContextGuard implements CanActivate {
  constructor(
    private readonly workspaceAuthorizationService:
      WorkspaceAuthorizationService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthorizedRequest>();

    if (!request.user?.userId) {
      throw new UnauthorizedException(
        'User is not authenticated',
      );
    }

    const restaurantId =
      request.header('X-Restaurant-Id');

    if (!restaurantId?.trim()) {
      throw new ForbiddenException(
        'A restaurant must be selected',
      );
    }

    const workspace =
      await this.workspaceAuthorizationService.getWorkspaceAccess(
        request.user.userId,
        restaurantId,
      );

    request.workspaceAuthorization = {
      restaurantId: workspace.restaurantId,
      organizationId: workspace.organizationId,
      permissions: workspace.permissions,
    };

    return true;
  }
}