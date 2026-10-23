import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { envValidationSchema } from './config/env.validation.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './database/prisma/prisma.module.js';
import { PlansModule } from './modules/plans/plans.module.js';
import { CatalogsModule } from './modules/catalogs/catalogs.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module.js';
import { PrismaService } from './database/prisma/prisma.service.js';
import { WorkspaceModule } from './modules/workspace/workspace.module.js';
import { AuthorizationModule } from './common/authorization/authorization.module.js';
import { OrganizationMembersModule } from './modules/organization-members/organization-members.module.js';
import { PermissionsModule } from './modules/permissions/permissions.module.js';
import { RolesModule } from './modules/roles/roles.module.js';
import { RestaurantsModule } from './modules/restaurants/restaurants.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    HealthModule,
    PrismaModule,
    PlansModule,
    CatalogsModule,
    AuthModule,
    PaymentsModule,
    SubscriptionsModule,
    WorkspaceModule,
    AuthorizationModule,
    OrganizationMembersModule,
    PermissionsModule,
    RolesModule,
    RestaurantsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}