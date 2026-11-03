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
    ) { }

    /**
     * Registra un usuario y crea su organización,
     * restaurante, membresías y suscripción.
     */
    async register(registerDto: RegisterDto) {
        const email = registerDto.email.trim().toLowerCase();

        // 1. Validar aceptación de términos.
        if (registerDto.terms !== true) {
            throw new BadRequestException(
                'You must accept the terms and conditions',
            );
        }

        // 2. Validar que exista al menos una sede.
        if (
            !Array.isArray(registerDto.restaurants) ||
            registerDto.restaurants.length === 0
        ) {
            throw new BadRequestException(
                'At least one restaurant location is required',
            );
        }

        // Evitar solicitudes excesivamente grandes durante el registro.
        if (registerDto.restaurants.length > 50) {
            throw new BadRequestException(
                'You cannot register more than 50 locations at once',
            );
        }

        // 3. Comprobar si el correo ya está registrado.
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });

        if (existingUser) {
            throw new ConflictException(
                'An account with this email already exists',
            );
        }

        // 4. Validar cocina.
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

        // 5. Validar rango de precio.
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

        // 6. Validar plan.
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
                maxRestaurants: true,
            },
        });

        if (!plan || !plan.isActive) {
            throw new BadRequestException(
                'Plan not found or inactive',
            );
        }

        // 7. Validar límite de sedes del plan.
        if (
            plan.maxRestaurants !== null &&
            registerDto.restaurants.length > plan.maxRestaurants
        ) {
            throw new BadRequestException(
                `The selected plan allows a maximum of ${plan.maxRestaurants} locations`,
            );
        }

        // 8. Validar los datos básicos de cada sede.
        for (const [index, branch] of registerDto.restaurants.entries()) {
            if (
                !branch.name?.trim() ||
                !branch.address?.trim() ||
                !branch.city?.trim()
            ) {
                throw new BadRequestException(
                    `Location ${index + 1} must have a name, address and city`,
                );
            }

            // Las coordenadas deben estar dentro de sus rangos válidos.
            if (
                branch.latitude !== undefined &&
                branch.latitude !== null &&
                (!Number.isFinite(Number(branch.latitude)) ||
                    Number(branch.latitude) < -90 ||
                    Number(branch.latitude) > 90)
            ) {
                throw new BadRequestException(
                    `Invalid latitude for location ${index + 1}`,
                );
            }

            if (
                branch.longitude !== undefined &&
                branch.longitude !== null &&
                (!Number.isFinite(Number(branch.longitude)) ||
                    Number(branch.longitude) < -180 ||
                    Number(branch.longitude) > 180)
            ) {
                throw new BadRequestException(
                    `Invalid longitude for location ${index + 1}`,
                );
            }
        }

        // 9. Calcular hash de la contraseña usando Argon2id.
        const passwordHash = await argon2.hash(
            registerDto.password,
            {
                type: argon2.argon2id,
            },
        );

        // 10. Crear todos los registros relacionados atómicamente.
        const result = await this.prisma.$transaction(async (tx) => {
            // 10.1. Crear usuario.
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

            // 10.2. Crear organización.
            const organization = await tx.organization.create({
                data: {
                    name: registerDto.restaurantName.trim(),
                },
                select: {
                    id: true,
                    name: true,
                },
            });

            // 10.3. Registrar propietario de la organización.
            const organizationMembership =
                await tx.organizationMember.create({
                    data: {
                        userId: user.id,
                        organizationId: organization.id,
                        role: 'OWNER',
                        allRestaurants: true,
                    },
                    select: {
                        id: true,
                        role: true,
                        allRestaurants: true,
                    },
                });

            // 10.4. Crear todas las sedes asociadas a la organización.
            const restaurants = await Promise.all(
                registerDto.restaurants.map((branch) =>
                    tx.restaurant.create({
                        data: {
                            organizationId: organization.id,

                            // Información de la sede.
                            name: branch.name.trim(),

                            description:
                                branch.description?.trim() ||
                                registerDto.description?.trim() ||
                                null,

                            phone:
                                branch.phone?.trim() ||
                                registerDto.phone?.trim() ||
                                null,

                            address: branch.address.trim(),
                            city: branch.city.trim(),
                            department:
                                branch.department?.trim() || null,

                            latitude:
                                branch.latitude === undefined ||
                                    branch.latitude === null
                                    ? null
                                    : Number(branch.latitude),

                            longitude:
                                branch.longitude === undefined ||
                                    branch.longitude === null
                                    ? null
                                    : Number(branch.longitude),

                            // Información pública compartida.
                            website:
                                registerDto.website?.trim() || null,

                            instagram:
                                registerDto.instagram?.trim() || null,

                            facebook:
                                registerDto.facebook?.trim() || null,

                            // Catálogos compartidos.
                            cuisineId: cuisine.id,
                            priceRangeId: priceRange.id,
                        },
                        select: {
                            id: true,
                            organizationId: true,
                            name: true,
                            description: true,
                            phone: true,
                            address: true,
                            city: true,
                            department: true,
                            latitude: true,
                            longitude: true,
                            website: true,
                            instagram: true,
                            facebook: true,
                            status: true,
                            createdAt: true,
                        },
                    }),
                ),
            );

            // 10.5. Registrar al propietario en todas las sedes.
            await tx.restaurantMember.createMany({
                data: restaurants.map((restaurant) => ({
                    userId: user.id,
                    restaurantId: restaurant.id,
                    role: 'OWNER',
                    roleId: 'system_role_owner',
                })),
                skipDuplicates: true,
            });

            // 10.6. Determinar estado inicial de la suscripción.
            // Conservamos el comportamiento existente: no se utilizan
            // pruebas gratuitas y el estado depende del plan.
            const subscriptionStatus = plan.requiresPayment
                ? 'PENDING'
                : 'ACTIVE';

            const now = new Date();

            // 10.7. Crear una suscripción para la organización,
            // vinculada a la primera sede.
            //
            // Esto mantiene el comportamiento de tu implementación
            // actual. No crea una suscripción independiente por sede.
            const primaryRestaurant = restaurants[0];

            const subscription = await tx.subscription.create({
                data: {
                    organizationId: organization.id,
                    restaurantId: primaryRestaurant.id,
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
                restaurants,
                organizationMembership,
                subscription,
            };
        });

        // 11. Generar tokens para autenticar al usuario.
        const tokens = await this.authTokenService.generateTokens(
            result.user.id,
            result.user.email,
        );

        // 12. Responder sin exponer la contraseña ni datos internos.
        return {
            message: 'Registration successful',
            data: {
                user: result.user,
                organization: result.organization,

                // Ahora devolvemos todas las sedes.
                restaurants: result.restaurants,

                // Conservamos la compatibilidad con consumidores
                // anteriores que esperan una propiedad "restaurant".
                restaurant: result.restaurants[0],

                // Conservamos los demás campos de la respuesta.
                membership: result.organizationMembership,
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

        // Obtener organizaciones y sus sedes.
        const organizations =
            await this.getUserOrganizations(user.id);

        // Generar tokens independientemente del estado
        // de los restaurantes.
        const tokens = await this.authTokenService.generateTokens(
            user.id,
            user.email,
        );

        const restaurants = organizations.flatMap(
            (organization) => organization?.restaurants ?? [],
        );

        return {
            auth: tokens,

            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                status: user.status,
            },

            organizations,

            // Se conserva por compatibilidad con Angular.
            restaurants,
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
            },
        });

        if (!user || user.status !== 'ACTIVE') {
            throw new UnauthorizedException(
                'User is not authenticated',
            );
        }

        const organizations =
            await this.getUserOrganizations(user.id);

        const restaurants = organizations.flatMap(
            (organization) => organization?.restaurants ?? [],
        );

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                status: user.status,
                createdAt: user.createdAt,
            },

            organizations,

            // Compatibilidad temporal con el frontend actual.
            restaurants,
        };
    }

    private async getUserOrganizations(userId: string) {
  const memberships = await this.prisma.organizationMember.findMany({
    where: {
      userId,
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  });

  return Promise.all(
    memberships.map(async (membership) => {
      const [restaurants, subscription] = await Promise.all([
        this.prisma.restaurant.findMany({
          where: {
            organizationId: membership.organizationId,
            ...(membership.allRestaurants
              ? {}
              : {
                  memberships: {
                    some: { userId },
                  },
                }),
          },
          select: {
            id: true,
            organizationId: true,
            name: true,
            city: true,
            status: true,
          },
        }),
        this.prisma.subscription.findFirst({
          where: { organizationId: membership.organizationId },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            startsAt: true,
            trialEndsAt: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            canceledAt: true,
            plan: {
              select: {
                id: true,
                code: true,
                name: true,
                description: true,
                priceAmount: true,
                currency: true,
                billingInterval: true,
                maxUsers: true,
                maxActivePromotions: true,
                maxRestaurants: true,
                features: {
                  select: {
                    feature: {
                      select: {
                        code: true,
                        name: true,
                        description: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }),
      ]);

      return {
        id: membership.organization.id,
        name: membership.organization.name,
        status: membership.organization.status,
        membership: {
          id: membership.id,
          role: membership.role,
          allRestaurants: membership.allRestaurants,
        },
        restaurants,
        subscription: subscription
          ? {
              ...subscription,
              plan: {
                ...subscription.plan,
                priceAmount: subscription.plan.priceAmount.toString(),
                features: subscription.plan.features.map(
                  ({ feature }) => feature,
                ),
                limits: {
                  maxUsers: subscription.plan.maxUsers,
                  maxActivePromotions: subscription.plan.maxActivePromotions,
                  maxRestaurants: subscription.plan.maxRestaurants,
                },
              },
            }
          : null,
      };
    }),
  );
}


}
