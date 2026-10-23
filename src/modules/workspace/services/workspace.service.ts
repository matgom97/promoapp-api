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
      const now = new Date();

      // 1. Validar usuario autenticado.
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

      // 2. Buscar el restaurante y validar su organización.
      const restaurant = await this.prisma.restaurant.findFirst({
        where: {
          id: restaurantId,
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
                  {
                    currentPeriodEnd: 'desc',
                  },
                  {
                    createdAt: 'desc',
                  },
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

      if (!restaurant) {
        throw new NotFoundException(
          'Active restaurant not found',
        );
      }

      // 3. Consultar la membresía de organización.
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
          'Active workspace membership not found',
        );
      }

      // 4. Consultar la asignación específica al restaurante.
      const restaurantMembership =
        await this.prisma.restaurantMember.findUnique({
          where: {
            userId_restaurantId: {
              userId,
              restaurantId,
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
          },
        });

      /*
       * Si el usuario no tiene acceso global,
       * debe tener una asignación específica.
       */
      if (
        !organizationMembership.allRestaurants &&
        !restaurantMembership
      ) {
        throw new NotFoundException(
          'Active workspace membership not found',
        );
      }

      /*
       * 5. Resolver el rol efectivo.
       *
       * Una asignación específica prevalece sobre
       * el rol general de la organización.
       */
      const effectiveRole =
        restaurantMembership?.role ??
        organizationMembership.role;

      const customRole =
        restaurantMembership?.customRole ?? null;

      if (customRole && !customRole.isActive) {
        throw new ForbiddenException(
          'The assigned custom role is inactive',
        );
      }

      const roleCode = customRole
        ? customRole.code
        : effectiveRole;

      const roleName = customRole
        ? customRole.name
        : effectiveRole;

      const permissions = customRole
        ? customRole.permissions.map(
            ({ permission }) => permission.code,
          )
        : SYSTEM_ROLE_PERMISSIONS[effectiveRole] ?? [];

      /*
       * 6. Seleccionar la suscripción de la organización.
       *
       * La suscripción habilita el producto, pero no
       * concede permisos administrativos al usuario.
       */
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

      if (!hasActiveSubscription) {
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
        'Workspace lookup completed successfully',
      );

      // 7. Devolver el contexto del workspace.
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
}