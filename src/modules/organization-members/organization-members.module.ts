import { Module } from '@nestjs/common';

import { OrganizationMembersController } from './controllers/organization-members.controller.js';
import { OrganizationMembersService } from './services/organization-members.service.js'; 
@Module({
  controllers: [OrganizationMembersController],
  providers: [OrganizationMembersService],
  exports: [OrganizationMembersService],
})
export class OrganizationMembersModule {}