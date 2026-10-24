import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { Throttle } from '@nestjs/throttler';

import type {
  Request,
  Response,
} from 'express';

import { ConfigService } from '@nestjs/config';

import { AuthService } from '../../services/auth/auth.service.js';

import { AuthTokenService } from '../../services/tokens/auth-token/auth-token.service.js';

import { RegisterDto } from '../../dto/register.dto.js';

import { LoginDto } from '../../dto/login.dto/login.dto.js';

import { JwtAuthGuard } from '../../guards/jwt-auth/jwt-auth.guard.js';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authTokenService: AuthTokenService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @Throttle({
    default: {
      limit: 3,
      ttl: 60000,
    },
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(
      registerDto,
    );

    this.setAuthCookies(
      response,
      result.data.auth,
    );

    return {
      message: result.message,
      data: {
        user: result.data.user,
        organization: result.data.organization,
        restaurant: result.data.restaurant,
        membership: result.data.membership,
        subscription: result.data.subscription,
        plan: result.data.plan,
      },
    };
  }

  @Post('login')
  @Throttle({
    default: {
      limit: 5,
      ttl: 60000,
    },
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );

    this.setAuthCookies(
      response,
      result.auth,
    );

    return {
      message: 'Login successful',
      data: {
        user: result.user,
        restaurants: result.restaurants,
      },
    };
  }

  @Post('refresh')
  @Throttle({
    default: {
      limit: 10,
      ttl: 60000,
    },
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refresh_token;

    if (
      typeof refreshToken !== 'string' ||
      refreshToken.length === 0
    ) {
      throw new UnauthorizedException(
        'Refresh token is missing',
      );
    }

    const tokens = await this.authService.refresh(
      refreshToken,
    );

    this.setAuthCookies(
      response,
      tokens,
    );

    return {
      message: 'Token refreshed successfully',
    };
  }

  @Post('logout')
  @Throttle({
    default: {
      limit: 10,
      ttl: 60000,
    },
  })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refresh_token;

    try {
      if (
        typeof refreshToken === 'string' &&
        refreshToken.length > 0
      ) {
        await this.authService.logout(refreshToken);
      }
    } finally {
      this.clearAuthCookies(response);
    }

    return {
      message: 'Logout successful',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(
    @Req() request: AuthenticatedRequest,
  ) {
    const user = request.user;

    if (!user?.userId) {
      throw new UnauthorizedException(
        'User is not authenticated',
      );
    }

    return {
      message: 'Authenticated user',
      data: await this.authService.me(
        user.userId,
      ),
    };
  }

  private setAuthCookies(
    response: Response,
    tokens: AuthTokens,
  ): void {
    const isProduction =
      this.configService.get<string>(
        'NODE_ENV',
        'development',
      ) === 'production';

    const accessMaxAge =
      this.parseDurationToMilliseconds(
        this.authTokenService.getAccessTokenExpiresIn(),
      );

    const refreshMaxAge =
      this.parseDurationToMilliseconds(
        this.authTokenService.getRefreshTokenExpiresIn(),
      );

    response.cookie(
      'access_token',
      tokens.accessToken,
      {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: accessMaxAge,
        path: '/',
      },
    );

    response.cookie(
      'refresh_token',
      tokens.refreshToken,
      {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: refreshMaxAge,
        path: '/api/v1/auth',
      },
    );
  }

  private clearAuthCookies(
    response: Response,
  ): void {
    const isProduction =
      this.configService.get<string>(
        'NODE_ENV',
        'development',
      ) === 'production';

    response.clearCookie(
      'access_token',
      {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        path: '/',
      },
    );

    response.clearCookie(
      'refresh_token',
      {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        path: '/api/v1/auth',
      },
    );
  }

  private parseDurationToMilliseconds(
    duration: string,
  ): number {
    const match = duration.match(
      /^(\d+)(s|m|h|d)$/,
    );

    if (!match) {
      throw new Error(
        'Invalid JWT expiration format',
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