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

@Injectable()
export class WorkspaceAuthorizationService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async getPermissions(
    userId: string,
    restaurantId: string,
  ): Promise<string[]> {
    const now = new Date();

    // 1. Validar usuario, restaurante y organización.
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

    // 2. Verificar la pertenencia a la organización.
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

    // 3. Buscar la membresía específica del restaurante.
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

    /*
     * Con acceso global, la membresía de organización
     * habilita el acceso al restaurante.
     *
     * Sin acceso global, se exige una asignación explícita.
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
     * 4. Determinar el rol efectivo.
     *
     * Si existe una membresía específica, su rol prevalece.
     * En caso contrario, se utiliza el rol de organización.
     */
    const effectiveRole =
      restaurantMembership?.role ??
      organizationMembership.role;

    const customRole =
      restaurantMembership?.customRole ?? null;

    // 5. Validar la suscripción de la organización.
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

    if (
      subscription.status !== 'ACTIVE' ||
      subscription.currentPeriodEnd === null ||
      subscription.currentPeriodEnd <= now
    ) {
      throw new ForbiddenException({
        code: 'SUBSCRIPTION_ACCESS_DENIED',
        subscriptionStatus: subscription.status,
        message:
          'An active and valid subscription is required to access this workspace.',
      });

    }

    // 6. Resolver permisos.
    if (customRole) {
      if (!customRole.isActive) {
        throw new ForbiddenException(
          'The assigned custom role is inactive',
        );
      }

      return [
        ...new Set(
          customRole.permissions.map(
            ({ permission }) => permission.code,
          ),
        ),
      ];
    }

    const permissions =
      SYSTEM_ROLE_PERMISSIONS[effectiveRole];

    if (!permissions) {
      throw new ForbiddenException(
        'The assigned role has no permission configuration',
      );
    }

    return [...new Set(permissions)];
  }

  async assertOrganizationPermission(
  userId: string,
  organizationId: string,
  requiredPermission: string,
): Promise<void> {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
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

  const organization = await this.prisma.organization.findFirst({
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

  /*
   * Por ahora, OWNER tiene administración completa.
   * Para los demás roles se utilizará la matriz del sistema.
   */
  const permissions: readonly string[] =
  SYSTEM_ROLE_PERMISSIONS[membership.role] ?? [];

if (!permissions.includes(requiredPermission)) {
  throw new ForbiddenException(
    `Missing required permission: ${requiredPermission}`,
  );
}
}
}