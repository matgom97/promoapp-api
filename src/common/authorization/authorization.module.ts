import { Module } from '@nestjs/common';

import { PrismaService } from '../../database/prisma/prisma.service.js';

import { PermissionsGuard } from './guards/permissions.guard.js';
import { WorkspaceContextGuard } from './guards/workspace-context.guard.js';

import { WorkspaceAuthorizationService } from './services/workspace-authorization.service.js';

@Module({
  providers: [
    PrismaService,
    PermissionsGuard,
    WorkspaceContextGuard,
    WorkspaceAuthorizationService,
  ],
  exports: [
    PermissionsGuard,
    WorkspaceContextGuard,
    WorkspaceAuthorizationService,
  ],
})
export class AuthorizationModule {}