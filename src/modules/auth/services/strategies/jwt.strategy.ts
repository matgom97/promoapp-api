import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';

import type { Request } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
) {
  constructor(
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromExtractors([
          (request: Request) =>
            request?.cookies?.access_token ??
            null,
        ]),

      ignoreExpiration: false,

      secretOrKey:
        configService.getOrThrow<string>(
          'JWT_ACCESS_SECRET',
        ),

      algorithms: ['HS256'],
    });
  }

  async validate(
    payload: JwtPayload,
  ) {
    if (!payload?.sub) {
      throw new UnauthorizedException(
        'Invalid authentication token',
      );
    }

    return {
      userId: payload.sub,
      email: payload.email,
    };
  }
}