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

    /**
     * Registra un usuario y crea su organización,
     * restaurante, membresías y suscripción.
     */
    async register(registerDto: RegisterDto) {
        const email = registerDto.email.trim().toLowerCase();

        // 1. Comprobar si el correo ya está registrado.
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });

        if (existingUser) {
            throw new ConflictException(
                'An account with this email already exists',
            );
        }

        // 2. Validar cocina.
        const cuisine = await this.prisma.cuisine.findUnique({
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

        // 3. Validar rango de precio.
        const priceRange = await this.prisma.priceRange.findUnique({
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

        // 4. Validar plan.
        const planCode = registerDto.planCode ?? 'starter';

        const plan = await this.prisma.plan.findUnique({
            where: {
                code: planCode,
            },
            select: {
                id: true,
                code: true,
                isActive: true,
                requiresPayment: true,
            },
        });

        if (!plan || !plan.isActive) {
            throw new BadRequestException(
                'Plan not found or inactive',
            );
        }

        // 5. Calcular hash de la contraseña.
        const passwordHash = await argon2.hash(
            registerDto.password,
            {
                type: argon2.argon2id,
            },
        );

        // 6. Crear todos los registros relacionados atómicamente.
        const result = await this.prisma.$transaction(async (tx) => {
            // 6.1. Crear usuario.
            const user = await tx.user.create({
                data: {
                    email,
                    passwordHash,
                    firstName: registerDto.name.trim(),
                    termsAcceptedAt: new Date(),
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    status: true,
                    createdAt: true,
                },
            });

            // 6.2. Crear organización.
            const organization = await tx.organization.create({
                data: {
                    name: registerDto.restaurantName.trim(),
                },
                select: {
                    id: true,
                    name: true,
                },
            });

            // 6.3. Crear restaurante asociado a la organización.
            const restaurant = await tx.restaurant.create({
                data: {
                    organizationId: organization.id,
                    name: registerDto.restaurantName.trim(),
                    description: registerDto.description.trim(),
                    phone: registerDto.phone?.trim(),
                    address: registerDto.address.trim(),
                    city: registerDto.city.trim(),
                    department: registerDto.department?.trim(),
                    latitude: registerDto.latitude,
                    longitude: registerDto.longitude,
                    website: registerDto.website?.trim(),
                    instagram: registerDto.instagram?.trim(),
                    facebook: registerDto.facebook?.trim(),
                    cuisineId: cuisine.id,
                    priceRangeId: priceRange.id,
                },
                select: {
                    id: true,
                    organizationId: true,
                    name: true,
                    city: true,
                    status: true,
                },
            });

            // 6.4. Registrar propietario de la organización.
            await tx.organizationMember.create({
                data: {
                    userId: user.id,
                    organizationId: organization.id,
                    role: 'OWNER',
                },
            });

            // 6.5. Registrar propietario del restaurante.
            const membership = await tx.restaurantMember.create({
                data: {
                    userId: user.id,
                    restaurantId: restaurant.id,
                    role: 'OWNER',
                    roleId: 'system_role_owner',
                },
                select: {
                    id: true,
                    role: true,
                },
            });

            // 6.6. Determinar el estado inicial de la suscripción.
            // No utilizamos pruebas gratuitas.
            const subscriptionStatus = plan.requiresPayment
                ? 'PENDING'
                : 'ACTIVE';

            const now = new Date();

            // 6.7. Crear la suscripción de la organización.
            const subscription = await tx.subscription.create({
                data: {
                    organizationId: organization.id,
                    restaurantId: restaurant.id,
                    planId: plan.id,
                    status: subscriptionStatus,
                    startsAt: now,
                    trialEndsAt: null,
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
                organization,
                restaurant,
                membership,
                subscription,
            };
        });

        // 7. Generar tokens para autenticar al usuario.
        const tokens = await this.authTokenService.generateTokens(
            result.user.id,
            result.user.email,
        );

        // 8. Responder sin exponer la contraseña ni datos internos.
        return {
            message: 'Registration successful',
            data: {
                user: result.user,
                organization: result.organization,
                restaurant: result.restaurant,
                membership: result.membership,
                subscription: result.subscription,
                plan: {
                    id: plan.id,
                    code: plan.code,
                },
                auth: {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                },
            },
        };
    }

    /**
     * Renueva el token de acceso.
     */
    async refresh(refreshToken: string) {
        return this.authTokenService.refreshAccessToken(
            refreshToken,
        );
    }

    /**
     * Cierra la sesión revocando el refresh token.
     */
    async logout(refreshToken: string): Promise<void> {
        await this.authTokenService.revokeRefreshToken(
            refreshToken,
        );
    }

    /**
     * Autentica al usuario y devuelve sus restaurantes asignados.
     */
    async login(email: string, password: string) {
        const normalizedEmail = email.trim().toLowerCase();

        const user = await this.prisma.user.findUnique({
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
                                organizationId: true,
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

        const passwordValid = await argon2.verify(
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

        const tokens = await this.authTokenService.generateTokens(
            user.id,
            user.email,
        );

        return {
            auth: tokens,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                status: user.status,
            },
            restaurants: user.memberships.map((membership) => ({
                id: membership.restaurant.id,
                organizationId: membership.restaurant.organizationId,
                name: membership.restaurant.name,
                city: membership.restaurant.city,
                status: membership.restaurant.status,
                membership: {
                    id: membership.id,
                    role: membership.role,
                },
            })),
        };
    }

    /**
     * Devuelve la información del usuario autenticado y sus restaurantes.
     */
    async me(userId: string) {
        const user = await this.prisma.user.findUnique({
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
                                organizationId: true,
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

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                status: user.status,
                createdAt: user.createdAt,
            },
            restaurants: user.memberships.map((membership) => ({
                id: membership.restaurant.id,
                organizationId: membership.restaurant.organizationId,
                name: membership.restaurant.name,
                city: membership.restaurant.city,
                status: membership.restaurant.status,
                membership: {
                    id: membership.id,
                    role: membership.role,
                },
            })),
        };
    }
}