import {
  Injectable,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { createHash } from 'node:crypto';
import { PrismaService } from '../../../../../database/prisma/prisma.service.js';



interface AccessTokenPayload {
  sub: string;
  email: string;
}

interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
}

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async generateTokens(
    userId: string,
    email: string,
  ) {
    const accessToken =
      await this.jwtService.signAsync({
        sub: userId,
        email,
      });

    const refreshToken =
      await this.jwtService.signAsync(
        {
          sub: userId,
          type: 'refresh',
        },
        {
          secret:
            this.configService.getOrThrow<string>(
              'JWT_REFRESH_SECRET',
            ),
          expiresIn:
            this.configService.get<string>(
              'JWT_REFRESH_EXPIRES_IN',
              '7d',
            ) as `${number}${'s' | 'm' | 'h' | 'd'}`,
        },
      );

    const tokenHash =
      this.hashToken(refreshToken);

    const expiresAt =
      new Date(
        Date.now() +
          this.getRefreshTokenDuration(),
      );

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshAccessToken(
    refreshToken: string,
  ) {
    const payload =
      await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret:
            this.configService.getOrThrow<string>(
              'JWT_REFRESH_SECRET',
            ),
          algorithms: ['HS256'],
        },
      );

    if (payload.type !== 'refresh') {
      throw new Error(
        'Invalid refresh token',
      );
    }

    const tokenHash =
      this.hashToken(refreshToken);

    const storedToken =
      await this.prisma.refreshToken.findUnique({
        where: {
          tokenHash,
        },
      });

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt <= new Date()
    ) {
      throw new Error(
        'Refresh token is invalid or expired',
      );
    }

    const user =
      await this.prisma.user.findUnique({
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
      user.status !== 'ACTIVE'
    ) {
      throw new Error(
        'User is not active',
      );
    }

    await this.prisma.refreshToken.update({
      where: {
        id: storedToken.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return this.generateTokens(
      user.id,
      user.email,
    );
  }

  async revokeRefreshToken(
    refreshToken: string,
  ): Promise<void> {
    const tokenHash =
      this.hashToken(refreshToken);

    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private hashToken(
    token: string,
  ): string {
    return createHash('sha256')
      .update(token)
      .digest('hex');
  }

  private getRefreshTokenDuration(): number {
    const expiresIn =
      this.configService.get<string>(
        'JWT_REFRESH_EXPIRES_IN',
        '7d',
      );

    const match =
      expiresIn.match(
        /^(\d+)([smhd])$/,
      );

    if (!match) {
      throw new Error(
        'Invalid JWT_REFRESH_EXPIRES_IN format',
      );
    }

    const value =
      Number(match[1]);

    const unit =
      match[2];

    const multipliers: Record<
      string,
      number
    > = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * multipliers[unit];
  }
}