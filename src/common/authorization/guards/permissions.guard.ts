import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { REQUIRED_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator.js';

interface AuthenticatedUser {
  userId: string;
  email: string;
}

interface WorkspaceAuthorization {
  permissions: string[];
}

interface AuthorizedRequest extends Request {
  user?: AuthenticatedUser;
  workspaceAuthorization?: WorkspaceAuthorization;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(
        REQUIRED_PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );

    // Los endpoints sin permisos declarados no requieren este guard.
    if (!requiredPermissions?.length) {
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

    const hasAllPermissions = requiredPermissions.every(
      (permission) => workspace.permissions.includes(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        'You do not have the required permissions',
      );
    }

    return true;
  }
}