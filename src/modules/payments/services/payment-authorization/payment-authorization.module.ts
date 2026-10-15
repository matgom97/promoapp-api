import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { SignOptions } from 'jsonwebtoken';

import { PaymentAuthorizationService } from './payment-authorization.service.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => {
        const expiresIn =
          configService.get<string>(
            'JWT_ACCESS_EXPIRES_IN',
            '15m',
          ) as SignOptions['expiresIn'];

        return {
          secret: configService.getOrThrow<string>(
            'JWT_ACCESS_SECRET',
          ),

          signOptions: {
            expiresIn,
            algorithm: 'HS256',
          },
        };
      },
    }),
  ],

  providers: [
    PaymentAuthorizationService,
  ],

  exports: [
    PaymentAuthorizationService,
  ],
})
export class PaymentAuthorizationModule {}