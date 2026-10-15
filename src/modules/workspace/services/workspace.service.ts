import {
    Injectable,
    NotFoundException,
    UnauthorizedException,
    Logger,
    InternalServerErrorException,
    ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../../../database/prisma/prisma.service.js';

import {
    SYSTEM_ROLE_PERMISSIONS,
} from '../../../common/authorization/constants/role-permissions.constant.js';

@Injectable()
export class WorkspaceService {
    private readonly logger = new Logger(WorkspaceService.name);

    constructor(
        private readonly prisma: PrismaService,
    ) {}

    async getWorkspace(
        userId: string,
        restaurantId: string,
    ) {
        this.logger.log('Starting workspace lookup');

        try {
            // 1. Consultar el usuario autenticado.
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

            // 2. Buscar exclusivamente la membresía de la sede seleccionada.
            const membership =
                await this.prisma.restaurantMember.findFirst({
                    where: {
                        userId,
                        restaurantId,
                        restaurant: {
                            status: 'ACTIVE',
                        },
                    },
                    select: {
                        id: true,
                        role: true,

                        customRole: {
                            select: {
                                code: true,
                                name: true,
                                isActive: true,

                                permissions: {
                                    where: {
                                        permission: {
                                            isActive: true,
                                        },
                                    },
                                    select: {
                                        permission: {
                                            select: {
                                                code: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },

                        restaurant: {
                            select: {
                                id: true,
                                organizationId: true,
                                name: true,
                                city: true,
                                status: true,

                                subscriptions: {
                                    orderBy: {
                                        createdAt: 'desc',
                                    },
                                    take: 1,
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
                                                    where: {
                                                        feature: {
                                                            isActive: true,
                                                        },
                                                    },
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
                                },
                            },
                        },
                    },
                });

            if (!membership) {
                throw new NotFoundException(
                    'Active workspace membership not found',
                );
            }

            // 3. Resolver el rol y sus permisos.
            const customRole = membership.customRole;

            if (customRole && !customRole.isActive) {
                throw new ForbiddenException(
                    'The assigned custom role is inactive',
                );
            }

            const roleCode = customRole
                ? customRole.code
                : membership.role;

            const roleName = customRole
                ? customRole.name
                : membership.role;

            const permissions = customRole
                ? customRole.permissions.map(
                    ({ permission }) => permission.code,
                )
                : SYSTEM_ROLE_PERMISSIONS[membership.role] ?? [];

            // 4. Obtener la suscripción y el plan.
            const subscription =
                membership.restaurant.subscriptions[0] ?? null;

            const plan = subscription?.plan ?? null;

            this.logger.log(
                'Workspace lookup completed successfully',
            );

            // 5. Devolver el contexto del workspace.
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    status: user.status,
                    createdAt: user.createdAt,
                },

                workspace: {
                    membershipId: membership.id,

                    restaurant: {
                        id: membership.restaurant.id,
                        organizationId:
                            membership.restaurant.organizationId,
                        name: membership.restaurant.name,
                        city: membership.restaurant.city,
                        status: membership.restaurant.status,
                    },

                    role: {
                        code: roleCode,
                        name: roleName,
                    },

                    permissions: [...new Set(permissions)],

                    subscription: subscription
                        ? {
                            id: subscription.id,
                            status: subscription.status,
                            startsAt: subscription.startsAt,
                            trialEndsAt: subscription.trialEndsAt,
                            currentPeriodStart:
                                subscription.currentPeriodStart,
                            currentPeriodEnd:
                                subscription.currentPeriodEnd,
                            canceledAt: subscription.canceledAt,
                        }
                        : null,

                    plan: plan
                        ? {
                            id: plan.id,
                            code: plan.code,
                            name: plan.name,
                            description: plan.description,
                            priceAmount: plan.priceAmount.toString(),
                            currency: plan.currency,
                            billingInterval: plan.billingInterval,

                            limits: {
                                maxUsers: plan.maxUsers,
                                maxActivePromotions:
                                    plan.maxActivePromotions,
                                maxRestaurants:
                                    plan.maxRestaurants,
                            },

                            features: plan.features.map(
                                ({ feature }) => ({
                                    code: feature.code,
                                    name: feature.name,
                                    description: feature.description,
                                }),
                            ),
                        }
                        : null,
                },
            };
        } catch (error: unknown) {
            if (
                error instanceof UnauthorizedException ||
                error instanceof NotFoundException ||
                error instanceof ForbiddenException
            ) {
                this.logger.warn(
                    `Workspace lookup rejected: ${error.message}`,
                );

                throw error;
            }

            if (error instanceof Error) {
                this.logger.error(
                    `Workspace lookup failed: ${error.message}`,
                    error.stack,
                );
            } else {
                this.logger.error(
                    'Workspace lookup failed with an unknown error',
                );
            }

            throw new InternalServerErrorException(
                'Unable to retrieve workspace',
            );
        }
    }
}