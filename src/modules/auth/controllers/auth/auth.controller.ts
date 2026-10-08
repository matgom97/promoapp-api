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



import type {
    Request,
    Response,
} from 'express';

import { AuthService } from '../../services/auth/auth.service.js';
import { RegisterDto } from '../../dto/register.dto.js';
import { JwtAuthGuard } from '../../guards/jwt-auth/jwt-auth.guard.js';
import { LoginDto } from '../../dto/login.dto/login.dto.js';

@Controller({
    path: 'auth',
    version: '1',
})
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) { }

    @Post('register')
    async register(
        @Body() registerDto: RegisterDto,
        @Res({ passthrough: true })
        response: Response,
    ) {
        const result =
            await this.authService.register(
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
                restaurant: result.data.restaurant,
                membership: result.data.membership,
                subscription: result.data.subscription,
                plan: result.data.plan,
            },
        };
    }

    @Post('refresh')
    async refresh(
        @Req() request: Request,
        @Res({ passthrough: true })
        response: Response,
    ) {
        const refreshToken =
            request.cookies?.refresh_token;

        if (!refreshToken) {
            throw new UnauthorizedException(
                'Refresh token is missing',
            );
        }

        const tokens =
            await this.authService.refresh(
                refreshToken,
            );

        this.setAuthCookies(
            response,
            tokens,
        );

        return {
            message:
                'Token refreshed successfully',
        };
    }

    @Post('logout')
    async logout(
        @Req() request: Request,
        @Res({ passthrough: true })
        response: Response,
    ) {
        const refreshToken =
            request.cookies?.refresh_token;

        if (refreshToken) {
            await this.authService.logout(
                refreshToken,
            );
        }

        this.clearAuthCookies(response);

        return {
            message: 'Logout successful',
        };
    }

    @Post('login')
    async login(
        @Body() loginDto: LoginDto,
        @Res({ passthrough: true })
        response: Response,
    ) {
        const result =
            await this.authService.login(
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
                restaurant: result.restaurant,
                membership: result.membership,
            },
        };
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async me(
        @Req() request: Request,
    ) {
        const user = request.user as {
            userId: string;
            email: string;
        };

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
        tokens: {
            accessToken: string;
            refreshToken: string;
        },
    ): void {
        const isProduction =
            process.env.NODE_ENV ===
            'production';

        response.cookie(
            'access_token',
            tokens.accessToken,
            {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction
                    ? 'strict'
                    : 'lax',
                maxAge:
                    15 * 60 * 1000,
                path: '/',
            },
        );

        response.cookie(
            'refresh_token',
            tokens.refreshToken,
            {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction
                    ? 'strict'
                    : 'lax',
                maxAge:
                    7 * 24 * 60 * 60 * 1000,
                path: '/api/v1/auth',
            },
        );
    }

    private clearAuthCookies(
        response: Response,
    ): void {
        response.clearCookie(
            'access_token',
            {
                path: '/',
            },
        );

        response.clearCookie(
            'refresh_token',
            {
                path: '/api/v1/auth',
            },
        );
    }
}