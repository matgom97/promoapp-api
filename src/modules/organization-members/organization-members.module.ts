import { Module } from '@nestjs/common';

import { OrganizationMembersController } from './controllers/organization-members.controller.js';
import { OrganizationMembersService } from './services/organization-members.service.js'; 
import { PlanAccessModule } from '../plan-access/plan-access.module.js';
@Module({
  controllers: [OrganizationMembersController],
  providers: [OrganizationMembersService],
  exports: [OrganizationMembersService],
  imports: [PlanAccessModule],
})
export class OrganizationMembersModule {}