import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { SignOptions } from 'jsonwebtoken';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './controllers/auth/auth.controller.js';
import { AuthService } from './services/auth/auth.service.js';
import { AuthTokenService } from './services/tokens/auth-token/auth-token.service.js';
import { JwtStrategy } from './services/strategies/jwt.strategy.js';

@Module({
  imports: [
    ConfigModule,

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

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

  controllers: [
    AuthController,
  ],

  providers: [
    AuthService,
    AuthTokenService,
    JwtStrategy,
  ],

  exports: [
    AuthService,
    AuthTokenService,
  ],
})
export class AuthModule {}