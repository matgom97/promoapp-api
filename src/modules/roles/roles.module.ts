import { Module } from '@nestjs/common';
import { RolesController } from './controllers/roles.controller.js';
import { RolesService } from './services/roles.service.js';
import { PrismaService } from '../../database/prisma/prisma.service.js';
import { AuthorizationModule } from '../../common/authorization/authorization.module.js';

@Module({
  imports: [AuthorizationModule],
  controllers: [RolesController],
  providers: [RolesService, PrismaService],
  exports: [RolesService],
})
export class RolesModule {}