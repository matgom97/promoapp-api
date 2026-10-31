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
  ) { }

  async getWorkspace(
    userId: string,
    restaurantId: string,
  ) {
    this.logger.log('Starting workspace lookup');

    try {
      const now = new Date();

      // 1. Validar usuario.
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
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

      // 2. Resolver una sede activa autorizada.
      const restaurant = await this.resolveActiveRestaurant(
        userId,
        restaurantId,
      );

      // 3. Obtener membresía de organización.
      const organizationMembership =
        await this.prisma.organizationMember.findUnique({
          where: {
            userId_organizationId: {
              userId,
              organizationId: restaurant.organizationId,
            },
          },
          select: {
            id: true,
            role: true,
            allRestaurants: true,
          },
        });

      if (!organizationMembership) {
        throw new NotFoundException(
          'Organization membership not found',
        );
      }

      // 4. Obtener membresía de restaurante.
      const restaurantMembership =
        await this.prisma.restaurantMember.findUnique({
          where: {
            userId_restaurantId: {
              userId,
              restaurantId: restaurant.id,
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
                isSystem: true,
                restaurantId: true,
                organizationId: true,
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
          },
        });

      if (
        !organizationMembership.allRestaurants &&
        !restaurantMembership
      ) {
        throw new NotFoundException(
          'Restaurant membership not found',
        );
      }

      // 5. Resolver permisos.

      // Los roles organizacionales tienen prioridad para OWNER y ADMIN.
      // Los roles de restaurante se utilizan para los demás miembros.
      const organizationHasAdministrativeRole =
        organizationMembership.role === 'OWNER' ||
        organizationMembership.role === 'ADMIN';

      const effectiveRole = organizationHasAdministrativeRole
        ? organizationMembership.role
        : restaurantMembership?.role ?? organizationMembership.role;

      const customRole = restaurantMembership?.customRole ?? null;

      // Determinar si el rol asignado es un rol del sistema.
      const isSystemRole = customRole?.isSystem === true;

      // Validar roles personalizados.
      // Los roles globales del sistema no necesitan restaurantId
      // ni organizationId.
      if (customRole && !isSystemRole) {
        const isRestaurantRole =
          customRole.restaurantId === restaurant.id &&
          customRole.organizationId === null;

        const isOrganizationRole =
          customRole.organizationId === restaurant.organizationId &&
          customRole.restaurantId === null;

        if (
          !customRole.isActive ||
          (!isRestaurantRole && !isOrganizationRole)
        ) {
          throw new ForbiddenException(
            'The assigned custom role is not valid for this organization',
          );
        }
      }

      // Resolver el rol efectivo.
      const useSystemPermissions =
        !customRole || isSystemRole || organizationHasAdministrativeRole;

      const roleCode = useSystemPermissions
        ? effectiveRole
        : customRole.code;

      const roleName = useSystemPermissions
        ? effectiveRole
        : customRole.name;

      const permissions = useSystemPermissions
        ? SYSTEM_ROLE_PERMISSIONS[effectiveRole] ?? []
        : customRole.permissions.map(
          ({ permission }) => permission.code,
        );

      // 6. Validar suscripción.
      const subscriptions =
        restaurant.organization.subscriptions;

      const activeSubscription = subscriptions.find(
        (item) =>
          item.status === 'ACTIVE' &&
          item.currentPeriodEnd !== null &&
          item.currentPeriodEnd > now,
      );

      const subscription =
        activeSubscription ??
        [...subscriptions].sort(
          (a, b) =>
            b.createdAt.getTime() - a.createdAt.getTime(),
        )[0] ??
        null;

      const hasActiveSubscription =
        subscription !== null &&
        subscription.status === 'ACTIVE' &&
        subscription.currentPeriodEnd !== null &&
        subscription.currentPeriodEnd > now;

      if (!hasActiveSubscription || !subscription) {
        throw new ForbiddenException({
          code: 'SUBSCRIPTION_REQUIRED',
          subscriptionId: subscription?.id ?? null,
          subscriptionStatus: subscription?.status ?? null,
          previousPlan: subscription?.plan
            ? {
              id: subscription.plan.id,
              name: subscription.plan.name,
              code: subscription.plan.code,
            }
            : null,
          message:
            'An active subscription is required to access this workspace.',
        });
      }

      const plan = subscription.plan;

      this.logger.log(
        `Workspace resolved successfully for restaurant ${restaurant.id}`,
      );

      // 7. Devolver el workspace de la sede resuelta.
      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          status: user.status,
          createdAt: user.createdAt,
        },

        workspace: {
          membershipId:
            restaurantMembership?.id ??
            organizationMembership.id,

          organization: {
            id: restaurant.organization.id,
            name: restaurant.organization.name,
            status: restaurant.organization.status,
          },

          restaurant: {
            id: restaurant.id,
            organizationId: restaurant.organizationId,
            name: restaurant.name,
            city: restaurant.city,
            status: restaurant.status,
          },

          role: {
            code: roleCode,
            name: roleName,
          },

          permissions: [...new Set(permissions)],

          subscription: {
            id: subscription.id,
            status: subscription.status,
            startsAt: subscription.startsAt,
            trialEndsAt: subscription.trialEndsAt,
            currentPeriodStart:
              subscription.currentPeriodStart,
            currentPeriodEnd:
              subscription.currentPeriodEnd,
            canceledAt: subscription.canceledAt,
          },

          plan: {
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
              maxRestaurants: plan.maxRestaurants,
            },

            features: plan.features.map(
              ({ feature }) => ({
                code: feature.code,
                name: feature.name,
                description: feature.description,
              }),
            ),
          },
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

  private async resolveActiveRestaurant(
    userId: string,
    requestedRestaurantId: string,
  ) {
    const requestedRestaurant =
      await this.prisma.restaurant.findUnique({
        where: {
          id: requestedRestaurantId,
        },
        select: {
          id: true,
          organizationId: true,
          status: true,
          organization: {
            select: {
              id: true,
              name: true,
              status: true,
              subscriptions: {
                orderBy: [
                  { currentPeriodEnd: 'desc' },
                  { createdAt: 'desc' },
                ],
                select: {
                  id: true,
                  status: true,
                  startsAt: true,
                  trialEndsAt: true,
                  currentPeriodStart: true,
                  currentPeriodEnd: true,
                  canceledAt: true,
                  createdAt: true,
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

    if (!requestedRestaurant) {
      throw new NotFoundException(
        'Restaurant not found',
      );
    }

    if (requestedRestaurant.organization.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'The organization is inactive',
      );
    }

    // Si el restaurante solicitado está activo, conservarlo.
    if (requestedRestaurant.status === 'ACTIVE') {
      return this.prisma.restaurant.findFirst({
        where: {
          id: requestedRestaurant.id,
          status: 'ACTIVE',
          organization: {
            status: 'ACTIVE',
          },
        },
        select: {
          id: true,
          organizationId: true,
          name: true,
          city: true,
          status: true,
          organization: {
            select: {
              id: true,
              name: true,
              status: true,
              subscriptions: {
                orderBy: [
                  { currentPeriodEnd: 'desc' },
                  { createdAt: 'desc' },
                ],
                select: {
                  id: true,
                  status: true,
                  startsAt: true,
                  trialEndsAt: true,
                  currentPeriodStart: true,
                  currentPeriodEnd: true,
                  canceledAt: true,
                  createdAt: true,
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
      }).then((restaurant) => {
        if (!restaurant) {
          throw new NotFoundException(
            'Active restaurant not found',
          );
        }

        return restaurant;
      });
    }

    // El restaurante solicitado está inactivo.
    // Buscar una sede activa a la que el usuario tenga acceso.
    const organizationMembership =
      await this.prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: requestedRestaurant.organizationId,
          },
        },
        select: {
          allRestaurants: true,
        },
      });

    if (!organizationMembership) {
      throw new NotFoundException(
        'Organization membership not found',
      );
    }

    const alternativeRestaurant =
      await this.prisma.restaurant.findFirst({
        where: {
          organizationId: requestedRestaurant.organizationId,
          status: 'ACTIVE',
          organization: {
            status: 'ACTIVE',
          },
          ...(organizationMembership.allRestaurants
            ? {}
            : {
              memberships: {
                some: {
                  userId,
                },
              },
            }),
        },
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          id: true,
          organizationId: true,
          name: true,
          city: true,
          status: true,
          organization: {
            select: {
              id: true,
              name: true,
              status: true,
              subscriptions: {
                orderBy: [
                  { currentPeriodEnd: 'desc' },
                  { createdAt: 'desc' },
                ],
                select: {
                  id: true,
                  status: true,
                  startsAt: true,
                  trialEndsAt: true,
                  currentPeriodStart: true,
                  currentPeriodEnd: true,
                  canceledAt: true,
                  createdAt: true,
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

    if (!alternativeRestaurant) {
      throw new NotFoundException(
        'No active restaurant is available for this organization',
      );
    }

    this.logger.warn(
      `Requested restaurant ${requestedRestaurantId} is inactive. ` +
      `Using active restaurant ${alternativeRestaurant.id} instead.`,
    );

    return alternativeRestaurant;
  }
}