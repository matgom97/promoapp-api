import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../../../database/prisma/prisma.service.js';

import {
  SYSTEM_ROLE_PERMISSIONS,
} from '../constants/role-permissions.constant.js';

export interface WorkspaceAccessContext {
  restaurantId: string;
  organizationId: string;
  permissions: string[];
}

@Injectable()
export class WorkspaceAuthorizationService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Devuelve el contexto autorizado del workspace.
   *
   * La organización se obtiene del restaurante validado,
   * nunca de un identificador proporcionado por el cliente.
   */
  async getWorkspaceAccess(
    userId: string,
    restaurantId: string,
  ): Promise<WorkspaceAccessContext> {
    const now = new Date();

    // 1. Validar restaurante y organización.
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
      },
    });

    if (!restaurant) {
      throw new NotFoundException(
        'Active restaurant not found',
      );
    }

    // 2. Validar usuario.
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException(
        'User is not authenticated',
      );
    }

    // 3. Validar membresía de organización.
    const organizationMembership =
      await this.prisma.organizationMember.findFirst({
        where: {
          userId,
          organizationId: restaurant.organizationId,
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

    // 4. Buscar membresía del restaurante.
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
              id: true,
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

    if (
      !organizationMembership.allRestaurants &&
      !restaurantMembership
    ) {
      throw new NotFoundException(
        'Active workspace membership not found',
      );
    }

    // 5. Determinar el rol efectivo.
    const effectiveRole =
      restaurantMembership?.role ??
      organizationMembership.role;

    const customRole =
      restaurantMembership?.customRole ?? null;

    // 6. Validar la suscripción de toda la organización.
    const subscription =
      await this.prisma.subscription.findFirst({
        where: {
          organizationId: restaurant.organizationId,
          status: 'ACTIVE',
          currentPeriodEnd: {
            gt: now,
          },
        },
        orderBy: {
          currentPeriodEnd: 'desc',
        },
        select: {
          id: true,
          status: true,
          currentPeriodEnd: true,
        },
      });

    if (!subscription) {
      const latestSubscription =
        await this.prisma.subscription.findFirst({
          where: {
            organizationId: restaurant.organizationId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            status: true,
            planId: true,
            plan: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        });

      throw new ForbiddenException({
        code: 'SUBSCRIPTION_REQUIRED',
        subscriptionId: latestSubscription?.id ?? null,
        subscriptionStatus: latestSubscription?.status ?? null,
        previousPlan: latestSubscription?.plan ?? null,
        message:
          'An active subscription is required to access this workspace.',
      });
    }

    // 7. Resolver permisos efectivos.
    let permissions: string[];

    if (customRole) {
      if (!customRole.isActive) {
        throw new ForbiddenException(
          'The assigned custom role is inactive',
        );
      }

      permissions = [
        ...new Set(
          customRole.permissions.map(
            ({ permission }) => permission.code,
          ),
        ),
      ];
    } else {
      const rolePermissions =
        SYSTEM_ROLE_PERMISSIONS[effectiveRole];

      if (!rolePermissions) {
        throw new ForbiddenException(
          'The assigned role has no permission configuration',
        );
      }

      permissions = [...new Set(rolePermissions)];
    }

    return {
      restaurantId: restaurant.id,
      organizationId: restaurant.organizationId,
      permissions,
    };
  }

  /**
   * Compatibilidad con los consumidores actuales
   * que solo necesitan la lista de permisos.
   */
  async getPermissions(
    userId: string,
    restaurantId: string,
  ): Promise<string[]> {
    const workspace = await this.getWorkspaceAccess(
      userId,
      restaurantId,
    );

    return workspace.permissions;
  }

  async assertOrganizationPermission(
    userId: string,
    organizationId: string,
    requiredPermission: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException(
        'User is not authenticated',
      );
    }

    const organization =
      await this.prisma.organization.findFirst({
        where: {
          id: organizationId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
        },
      });

    if (!organization) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    const membership =
      await this.prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
        select: {
          id: true,
          role: true,
        },
      });

    if (!membership) {
      throw new ForbiddenException(
        'You are not a member of this organization',
      );
    }

    const permissions: readonly string[] =
      SYSTEM_ROLE_PERMISSIONS[membership.role] ?? [];

    if (!permissions.includes(requiredPermission)) {
      throw new ForbiddenException(
        `Missing required permission: ${requiredPermission}`,
      );
    }
  }
}