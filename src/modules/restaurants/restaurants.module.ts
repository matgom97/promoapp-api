import { Module } from '@nestjs/common';

import { RestaurantsController } from './controllers/restaurants.controller.js';

import { PrismaModule } from '../../database/prisma/prisma.module.js';

import { WorkspaceAuthorizationService } from '../../common/authorization/services/workspace-authorization.service.js';
import { RestaurantsService } from './services/restaurants.service.js';

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [
    RestaurantsController,
  ],
  providers: [
    RestaurantsService,
    WorkspaceAuthorizationService,
  ],
  exports: [
    RestaurantsService,
  ],
})
export class RestaurantsModule {}