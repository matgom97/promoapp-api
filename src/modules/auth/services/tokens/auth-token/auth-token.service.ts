import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { createHash } from 'node:crypto';

import { PrismaService } from '../../../../../database/prisma/prisma.service.js';

interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
}

interface RefreshTokenRecord {
  id: string;
  userId: string;
  revokedAt: Date | null;
  expiresAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Genera un access token y un refresh token.
   * El refresh token se almacena mediante su hash.
   */
  async generateTokens(
    userId: string,
    email: string,
  ): Promise<AuthTokens> {
    const accessToken = await this.signAccessToken(
      userId,
      email,
    );

    const refreshToken = await this.signRefreshToken(
      userId,
    );

    const tokenHash = this.hashToken(refreshToken);

    const expiresAt = new Date(
      Date.now() + this.getRefreshTokenDuration(),
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

  /**
   * Verifica y rota un refresh token.
   * La revocación del token anterior y la creación
   * del nuevo registro se realizan en una transacción.
   */
  async refreshAccessToken(
    refreshToken: string,
  ): Promise<AuthTokens> {
    const payload = await this.verifyRefreshToken(
      refreshToken,
    );

    if (
      typeof payload.sub !== 'string' ||
      payload.sub.trim().length === 0 ||
      payload.type !== 'refresh'
    ) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    const tokenHash = this.hashToken(refreshToken);

    return this.prisma.$transaction(
      async (tx): Promise<AuthTokens> => {
        const rows = await tx.$queryRaw<
          RefreshTokenRecord[]
        >`
          SELECT
            id,
            userId,
            revokedAt,
            expiresAt
          FROM refresh_tokens
          WHERE tokenHash = ${tokenHash}
          FOR UPDATE
        `;

        const storedToken = rows[0];

        if (
          !storedToken ||
          storedToken.revokedAt !== null ||
          new Date(storedToken.expiresAt).getTime() <= Date.now() ||
          storedToken.userId !== payload.sub
        ) {
          throw new UnauthorizedException(
            'Refresh token is invalid or expired',
          );
        }

        const user = await tx.user.findUnique({
          where: {
            id: payload.sub,
          },
          select: {
            id: true,
            email: true,
            status: true,
          },
        });

        if (!user || user.status !== 'ACTIVE') {
          throw new UnauthorizedException(
            'User is not authenticated',
          );
        }

        const accessToken = await this.signAccessToken(
          user.id,
          user.email,
        );

        const nextRefreshToken =
          await this.signRefreshToken(user.id);

        const nextTokenHash = this.hashToken(
          nextRefreshToken,
        );

        const now = new Date();

        const nextExpiresAt = new Date(
          now.getTime() + this.getRefreshTokenDuration(),
        );

        const revoked = await tx.refreshToken.updateMany({
          where: {
            id: storedToken.id,
            tokenHash,
            revokedAt: null,
            expiresAt: {
              gt: now,
            },
          },
          data: {
            revokedAt: now,
          },
        });

        if (revoked.count !== 1) {
          throw new UnauthorizedException(
            'Refresh token is invalid or expired',
          );
        }

        await tx.refreshToken.create({
          data: {
            userId: user.id,
            tokenHash: nextTokenHash,
            expiresAt: nextExpiresAt,
          },
        });

        return {
          accessToken,
          refreshToken: nextRefreshToken,
        };
      },
      {
        maxWait: 5000,
        timeout: 10000,
      },
    );
  }

  /**
   * Revoca un refresh token activo.
   */
  async revokeRefreshToken(
    refreshToken: string,
  ): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);

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

  /**
   * Devuelve la expiración configurada del access token.
   */
  getAccessTokenExpiresIn(): string {
    return this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      '15m',
    );
  }

  /**
   * Devuelve la expiración configurada del refresh token.
   */
  getRefreshTokenExpiresIn(): string {
    return this.getRefreshExpiresIn();
  }

  /**
   * Firma el access token utilizando HS256.
   */
  private async signAccessToken(
    userId: string,
    email: string,
  ): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: userId,
        email,
      },
      {
        secret: this.getAccessSecret(),
        expiresIn: this.getAccessTokenExpiresIn() as never,
        algorithm: 'HS256',
      },
    );
  }

  /**
   * Firma el refresh token utilizando un secreto independiente.
   */
  private async signRefreshToken(
    userId: string,
  ): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: userId,
        type: 'refresh',
      },
      {
        secret: this.getRefreshSecret(),
        expiresIn: this.getRefreshExpiresIn() as never,
        algorithm: 'HS256',
      },
    );
  }

  /**
   * Verifica la firma y la expiración del refresh token.
   */
  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.getRefreshSecret(),
          algorithms: ['HS256'],
        },
      );
    } catch {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }
  }

  private getAccessSecret(): string {
    return this.configService.getOrThrow<string>(
      'JWT_ACCESS_SECRET',
    );
  }

  private getRefreshSecret(): string {
    return this.configService.getOrThrow<string>(
      'JWT_REFRESH_SECRET',
    );
  }

  private getRefreshExpiresIn(): string {
    return this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
  }

  /**
   * Genera el hash SHA-256 del token para almacenarlo.
   */
  private hashToken(token: string): string {
    return createHash('sha256')
      .update(token)
      .digest('hex');
  }

  /**
   * Convierte la expiración del refresh token a milisegundos.
   */
  private getRefreshTokenDuration(): number {
    const expiresIn = this.getRefreshExpiresIn();

    const match = expiresIn.match(/^(\d+)(s|m|h|d)$/);

    if (!match) {
      throw new Error(
        'Invalid JWT_REFRESH_EXPIRES_IN format',
      );
    }

    const value = Number(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * multipliers[unit];
  }
}