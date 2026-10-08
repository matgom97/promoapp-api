import {
    BadRequestException,
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

import * as argon2 from 'argon2';

import { PrismaService } from '../../../../database/prisma/prisma.service.js';
import { RegisterDto } from '../../dto/register.dto.js';
import { AuthTokenService } from '../tokens/auth-token/auth-token.service.js';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly authTokenService: AuthTokenService,
    ) {}

    async register(registerDto: RegisterDto) {
        const email = registerDto.email
            .trim()
            .toLowerCase();

        // 1. Verificar email
        const existingUser =
            await this.prisma.user.findUnique({
                where: {
                    email,
                },
                select: {
                    id: true,
                },
            });

        if (existingUser) {
            throw new ConflictException(
                'An account with this email already exists',
            );
        }

        // 2. Buscar cocina
        const cuisine =
            await this.prisma.cuisine.findUnique({
                where: {
                    code: registerDto.cuisineCode,
                },
                select: {
                    id: true,
                    isActive: true,
                },
            });

        if (!cuisine || !cuisine.isActive) {
            throw new BadRequestException(
                'Cuisine not found or inactive',
            );
        }

        // 3. Buscar rango de precio
        const priceRange =
            await this.prisma.priceRange.findUnique({
                where: {
                    code: registerDto.priceRangeCode,
                },
                select: {
                    id: true,
                    isActive: true,
                },
            });

        if (!priceRange || !priceRange.isActive) {
            throw new BadRequestException(
                'Price range not found or inactive',
            );
        }

        // 4. Buscar plan
        const planCode =
            registerDto.planCode ?? 'starter';

        const plan =
            await this.prisma.plan.findUnique({
                where: {
                    code: planCode,
                },
                select: {
                    id: true,
                    code: true,
                    isActive: true,
                    requiresPayment: true,
                    trialDays: true,
                },
            });

        if (!plan || !plan.isActive) {
            throw new BadRequestException(
                'Plan not found or inactive',
            );
        }

        // 5. Generar hash de contraseña
        const passwordHash =
            await argon2.hash(
                registerDto.password,
                {
                    type: argon2.argon2id,
                },
            );

        // 6. Crear registros en una transacción
        const result =
            await this.prisma.$transaction(
                async (tx) => {
                    const user =
                        await tx.user.create({
                            data: {
                                email,
                                passwordHash,
                                firstName:
                                    registerDto.name.trim(),
                                termsAcceptedAt:
                                    new Date(),
                            },
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                status: true,
                                createdAt: true,
                            },
                        });

                    const restaurant =
                        await tx.restaurant.create({
                            data: {
                                name:
                                    registerDto.restaurantName.trim(),
                                description:
                                    registerDto.description.trim(),
                                phone:
                                    registerDto.phone?.trim(),
                                address:
                                    registerDto.address.trim(),
                                city:
                                    registerDto.city.trim(),
                                department:
                                    registerDto.department?.trim(),
                                latitude:
                                    registerDto.latitude,
                                longitude:
                                    registerDto.longitude,
                                website:
                                    registerDto.website?.trim(),
                                instagram:
                                    registerDto.instagram?.trim(),
                                facebook:
                                    registerDto.facebook?.trim(),
                                cuisineId:
                                    cuisine.id,
                                priceRangeId:
                                    priceRange.id,
                            },
                            select: {
                                id: true,
                                name: true,
                                city: true,
                                status: true,
                            },
                        });

                    const membership =
                        await tx.restaurantMember.create({
                            data: {
                                userId: user.id,
                                restaurantId:
                                    restaurant.id,
                                role: 'OWNER',
                            },
                            select: {
                                id: true,
                                role: true,
                            },
                        });

                    const subscriptionStatus =
                        plan.requiresPayment
                            ? 'PENDING'
                            : plan.trialDays > 0
                                ? 'TRIALING'
                                : 'ACTIVE';

                    const now = new Date();

                    const subscription =
                        await tx.subscription.create({
                            data: {
                                restaurantId:
                                    restaurant.id,
                                planId: plan.id,
                                status:
                                    subscriptionStatus,
                                startsAt: now,
                                trialEndsAt:
                                    plan.trialDays > 0
                                        ? new Date(
                                            now.getTime() +
                                            plan.trialDays *
                                            24 *
                                            60 *
                                            60 *
                                            1000,
                                        )
                                        : null,
                            },
                            select: {
                                id: true,
                                status: true,
                                startsAt: true,
                                trialEndsAt: true,
                            },
                        });

                    return {
                        user,
                        restaurant,
                        membership,
                        subscription,
                        plan: {
                            code: plan.code,
                        },
                    };
                },
            );

        // 7. Autenticar automáticamente al usuario
        const tokens =
            await this.authTokenService.generateTokens(
                result.user.id,
                result.user.email,
            );

        // 8. Respuesta
        return {
            message: 'Registration successful',
            data: {
                ...result,
                auth: {
                    accessToken:
                        tokens.accessToken,
                    refreshToken:
                        tokens.refreshToken,
                },
            },
        };
    }

    async refresh(refreshToken: string) {
        return this.authTokenService.refreshAccessToken(
            refreshToken,
        );
    }

    async logout(
        refreshToken: string,
    ): Promise<void> {
        await this.authTokenService.revokeRefreshToken(
            refreshToken,
        );
    }

    async login(
        email: string,
        password: string,
    ) {
        const normalizedEmail =
            email.trim().toLowerCase();

        const user =
            await this.prisma.user.findUnique({
                where: {
                    email: normalizedEmail,
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    passwordHash: true,
                    status: true,

                    memberships: {
                        select: {
                            id: true,
                            role: true,

                            restaurant: {
                                select: {
                                    id: true,
                                    name: true,
                                    city: true,
                                    status: true,
                                },
                            },
                        },
                    },
                },
            });

        if (!user) {
            throw new BadRequestException(
                'Invalid email or password',
            );
        }

        const passwordValid =
            await argon2.verify(
                user.passwordHash,
                password,
            );

        if (!passwordValid) {
            throw new BadRequestException(
                'Invalid email or password',
            );
        }

        if (user.status !== 'ACTIVE') {
            throw new BadRequestException(
                'User account is not active',
            );
        }

        const tokens =
            await this.authTokenService.generateTokens(
                user.id,
                user.email,
            );

        const membership =
            user.memberships[0];

        return {
            auth: tokens,

            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                status: user.status,
            },

            restaurant:
                membership?.restaurant ?? null,

            membership: membership
                ? {
                    id: membership.id,
                    role: membership.role,
                }
                : null,
        };
    }

    async me(userId: string) {
        const user =
            await this.prisma.user.findUnique({
                where: {
                    id: userId,
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    status: true,
                    createdAt: true,

                    memberships: {
                        select: {
                            id: true,
                            role: true,

                            restaurant: {
                                select: {
                                    id: true,
                                    name: true,
                                    city: true,
                                    status: true,
                                },
                            },
                        },
                    },
                },
            });

        if (!user || user.status !== 'ACTIVE') {
            throw new UnauthorizedException(
                'User is not authenticated',
            );
        }

        const membership =
            user.memberships[0];

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                status: user.status,
                createdAt: user.createdAt,
            },

            restaurant:
                membership?.restaurant ?? null,

            membership: membership
                ? {
                    id: membership.id,
                    role: membership.role,
                }
                : null,
        };
    }
}