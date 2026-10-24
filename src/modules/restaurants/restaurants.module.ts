import { Module } from '@nestjs/common';
                                   
import { PrismaService } from '../../database/prisma/prisma.service.js';
import { AuthorizationModule } from '../../common/authorization/authorization.module.js';
import { RestaurantsController } from './restaurants.controller.js';
import { RestaurantsService } from './restaurants.service.js';
import { PrismaModule } from '../../database/prisma/prisma.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthorizationModule,
  ],
  controllers: [RestaurantsController],
  providers: [RestaurantsService],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}