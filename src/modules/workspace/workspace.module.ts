import { Module } from '@nestjs/common';
import { WorkspaceController } from './controllers/workspace.controller.js';
import { WorkspaceService } from './services/workspace.service.js';
import { AuthorizationModule } from '../../common/authorization/authorization.module.js';

@Module({
  imports: [AuthorizationModule],
  controllers: [WorkspaceController],
  providers: [WorkspaceService]
})
export class WorkspaceModule {}
