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

import { PrismaService } from '../../../../database/prisma/prisma.service.js';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
  'jwt',
) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) =>
          request?.cookies?.access_token ?? null,
      ]),

      ignoreExpiration: false,

      secretOrKey: configService.getOrThrow<string>(
        'JWT_ACCESS_SECRET',
      ),

      algorithms: ['HS256'],
    });
  }

  async validate(
    payload: JwtPayload,
  ): Promise<{
    userId: string;
    email: string;
  }> {
    if (
      !payload ||
      typeof payload.sub !== 'string' ||
      payload.sub.trim().length === 0 ||
      typeof payload.email !== 'string' ||
      payload.email.trim().length === 0
    ) {
      throw new UnauthorizedException(
        'Invalid authentication token',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },

      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    if (
      !user ||
      user.status !== 'ACTIVE' ||
      user.email !== payload.email
    ) {
      throw new UnauthorizedException(
        'Invalid authentication token',
      );
    }

    return {
      userId: user.id,
      email: user.email,
    };
  }
}