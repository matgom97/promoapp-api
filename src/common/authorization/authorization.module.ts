import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma/prisma.module.js';

import { PermissionsGuard } from './guards/permissions.guard.js';
import { WorkspaceContextGuard } from './guards/workspace-context.guard.js';

import { WorkspaceAuthorizationService } from './services/workspace-authorization.service.js';
import { PermissionResolverService } from './services/permission-resolver.service.js';

@Module({
  imports: [PrismaModule],
  providers: [
    PermissionsGuard,
    WorkspaceContextGuard,
    WorkspaceAuthorizationService,
    PermissionResolverService,
  ],
  exports: [
    PermissionsGuard,
    WorkspaceContextGuard,
    WorkspaceAuthorizationService,
    PermissionResolverService,
  ],
})
export class AuthorizationModule {}