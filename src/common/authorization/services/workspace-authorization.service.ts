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

import type { MembershipRole } from '@prisma/client';

/**
 * Contexto de acceso operativo a una sede.
 *
 * Este contexto solamente se devuelve cuando el restaurante
 * está activo y el usuario tiene autorización para acceder.
 */
export interface WorkspaceAccessContext {
  restaurantId: string;
  organizationId: string;
  permissions: string[];
}

/**
 * Contexto de acceso a una organización.
 *
 * No requiere que exista un restaurante activo.
 */
export interface OrganizationAccessContext {
  organizationId: string;
  allRestaurants: boolean;
  restaurantIds: string[];
  permissions: string[];
}

@Injectable()
export class WorkspaceAuthorizationService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  // ============================================================
  // ACCESO OPERATIVO A UN RESTAURANTE
  // ============================================================

  /**
   * Obtiene el contexto autorizado de una sede activa.
   *
   * IMPORTANTE:
   * - El usuario debe estar activo.
   * - La organización debe estar activa.
   * - El restaurante debe estar activo.
   * - El usuario debe tener acceso a la sede.
   * - La organización debe tener una suscripción vigente.
   *
   * Este método debe utilizarse para operaciones que requieren
   * una sede operativa.
   */
  async getWorkspaceAccess(
    userId: string,
    restaurantId: string,
  ): Promise<WorkspaceAccessContext> {
    await this.assertActiveUser(userId);

    const restaurant =
      await this.prisma.restaurant.findFirst({
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

    // ----------------------------------------------------------
    // Membresía de organización
    // ----------------------------------------------------------

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
        'Workspace not found',
      );
    }

    // ----------------------------------------------------------
    // Membresía de restaurante
    // ----------------------------------------------------------

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
              isActive: true,
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

    // ----------------------------------------------------------
    // Comprobar acceso al restaurante
    // ----------------------------------------------------------

    const hasRestaurantAccess =
      organizationMembership.allRestaurants ||
      restaurantMembership !== null;

    if (!hasRestaurantAccess) {
      throw new NotFoundException(
        'Workspace not found',
      );
    }

    // ----------------------------------------------------------
    // Resolver rol efectivo
    // ----------------------------------------------------------

    const effectiveRole: MembershipRole =
      restaurantMembership?.role ??
      organizationMembership.role;

    let permissions: string[];

    // Los roles privilegiados del sistema conservan
    // sus permisos configurados.
    if (
      effectiveRole === 'OWNER' ||
      effectiveRole === 'ADMIN'
    ) {
      permissions =
        this.getSystemRolePermissions(effectiveRole);
    } else {
      const customRole =
        restaurantMembership?.customRole ?? null;

      if (customRole) {
        if (
          !customRole.isActive ||
          customRole.restaurantId !== restaurant.id ||
          customRole.organizationId !== null
        ) {
          throw new ForbiddenException(
            'The assigned custom role is not valid for this restaurant',
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
        permissions =
          this.getSystemRolePermissions(effectiveRole);
      }
    }



    return {
      restaurantId: restaurant.id,
      organizationId: restaurant.organizationId,
      permissions,
    };
  }

  /**
 * Obtiene el contexto de autorización para administrar
 * el estado de una sede.
 *
 * Permite sedes ACTIVE e INACTIVE.
 * No permite sedes SUSPENDED.
 *
 * No requiere una suscripción activa.
 */
  async getRestaurantStatusAccess(
    userId: string,
    restaurantId: string,
  ): Promise<WorkspaceAccessContext> {
    await this.assertActiveUser(userId);

    const restaurant =
      await this.prisma.restaurant.findFirst({
        where: {
          id: restaurantId,
          status: {
            in: [
              'ACTIVE',
              'INACTIVE',
            ],
          },
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
        'Restaurant not found or cannot be modified',
      );
    }

    // Validar membresía organizacional.
    const organizationMembership =
      await this.prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: restaurant.organizationId,
          },
        },
        select: {
          role: true,
          allRestaurants: true,
        },
      });

    if (!organizationMembership) {
      throw new NotFoundException(
        'Workspace not found',
      );
    }

    // Validar membresía de restaurante.
    const restaurantMembership =
      await this.prisma.restaurantMember.findUnique({
        where: {
          userId_restaurantId: {
            userId,
            restaurantId,
          },
        },
        select: {
          role: true,
          customRole: {
            select: {
              id: true,
              isActive: true,
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

    const hasRestaurantAccess =
      organizationMembership.allRestaurants ||
      restaurantMembership !== null;

    if (!hasRestaurantAccess) {
      throw new NotFoundException(
        'Workspace not found',
      );
    }

    // Resolver rol efectivo.
    const effectiveRole: MembershipRole =
      restaurantMembership?.role ??
      organizationMembership.role;

    let permissions: string[];

    if (
      effectiveRole === 'OWNER' ||
      effectiveRole === 'ADMIN'
    ) {
      permissions =
        this.getSystemRolePermissions(effectiveRole);
    } else {
      const customRole =
        restaurantMembership?.customRole ?? null;

      if (customRole) {
        if (
          !customRole.isActive ||
          customRole.restaurantId !== restaurant.id ||
          customRole.organizationId !== null
        ) {
          throw new ForbiddenException(
            'The assigned custom role is not valid for this restaurant',
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
        permissions =
          this.getSystemRolePermissions(effectiveRole);
      }
    }

    return {
      restaurantId: restaurant.id,
      organizationId: restaurant.organizationId,
      permissions,
    };
  }



  // ============================================================
  // ACCESO A ORGANIZACIÓN
  // ============================================================

  /**
   * Obtiene el contexto de acceso a una organización.
   *
   * Este método NO requiere que exista un restaurante activo.
   *
   * Devuelve únicamente las sedes activas a las que el usuario
   * tiene acceso, pero una lista vacía no significa que el usuario
   * haya perdido el acceso a la organización.
   */
  async getOrganizationAccess(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationAccessContext> {
    await this.assertActiveUser(userId);

    // 1. Validar organización.
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

    // 2. Validar membresía.
    const membership =
      await this.prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
        select: {
          role: true,
          allRestaurants: true,
        },
      });

    if (!membership) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    // 3. Resolver permisos organizacionales.
    const permissions =
      this.getSystemRolePermissions(membership.role);

    // 4. Obtener todos los restaurantes autorizados.
    // No filtrar por estado.
    const restaurants =
      await this.prisma.restaurant.findMany({
        where: {
          organizationId,
          ...(membership.allRestaurants
            ? {}
            : {
              memberships: {
                some: {
                  userId,
                },
              },
            }),
        },
        select: {
          id: true,
          status: true,
        },
      });

    return {
      organizationId,
      allRestaurants: membership.allRestaurants,
      restaurantIds: restaurants.map(
        (restaurant) => restaurant.id,
      ),
      permissions,
    };
  }

  // ============================================================
  // PERMISOS DE RESTAURANTE
  // ============================================================

  /**
   * Devuelve los permisos efectivos de una sede activa.
   */
  async getPermissions(
    userId: string,
    restaurantId: string,
  ): Promise<string[]> {
    const workspace =
      await this.getWorkspaceAccess(
        userId,
        restaurantId,
      );

    return workspace.permissions;
  }

  /**
   * Comprueba un permiso específico dentro de una sede activa.
   */
  async assertRestaurantPermission(
    userId: string,
    restaurantId: string,
    requiredPermission: string,
  ): Promise<WorkspaceAccessContext> {
    const workspace =
      await this.getWorkspaceAccess(
        userId,
        restaurantId,
      );

    if (
      !workspace.permissions.includes(
        requiredPermission,
      )
    ) {
      throw new ForbiddenException({
        code: 'MISSING_PERMISSION',
        requiredPermission,
        message:
          'You do not have permission to perform this action.',
      });
    }

    return workspace;
  }

  // ============================================================
  // PERMISOS DE ORGANIZACIÓN
  // ============================================================

  /**
   * Autoriza una operación sobre una organización.
   *
   * Utiliza exclusivamente los permisos del rol organizacional.
   * No utiliza permisos de un rol personalizado de restaurante
   * como si fueran permisos globales.
   */
  async assertOrganizationPermission(
    userId: string,
    organizationId: string,
    requiredPermission: string,
  ): Promise<void> {
    const access =
      await this.getOrganizationAccess(
        userId,
        organizationId,
      );

    if (
      !access.permissions.includes(
        requiredPermission,
      )
    ) {
      throw new ForbiddenException({
        code: 'MISSING_PERMISSION',
        requiredPermission,
        message:
          'You do not have permission to perform this action.',
      });
    }
  }




  // ============================================================
  // VALIDACIÓN DE USUARIO
  // ============================================================

  /**
   * Comprueba que el usuario exista y esté activo.
   */
  private async assertActiveUser(
    userId: string,
  ): Promise<void> {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          status: true,
        },
      });

    if (
      !user ||
      user.status !== 'ACTIVE'
    ) {
      throw new UnauthorizedException(
        'User is not authenticated',
      );
    }
  }

  // ============================================================
  // PERMISOS DEL SISTEMA
  // ============================================================

  /**
   * Resuelve los permisos configurados para un rol del sistema.
   */
  private getSystemRolePermissions(
    role: MembershipRole,
  ): string[] {
    const rolePermissions =
      SYSTEM_ROLE_PERMISSIONS[role];

    if (!rolePermissions) {
      throw new ForbiddenException(
        'The assigned role has no permission configuration',
      );
    }

    return [
      ...new Set(rolePermissions),
    ];
  }

  // ============================================================
  // VALIDACIÓN DE SUSCRIPCIÓN
  // ============================================================

  /**
   * Verifica que la organización tenga una suscripción activa
   * cuya fecha de finalización sea posterior al momento actual.
   */
  private async assertActiveOrganizationSubscription(
    organizationId: string,
  ): Promise<void> {
    const now = new Date();

    const subscription =
      await this.prisma.subscription.findFirst({
        where: {
          organizationId,
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
        },
      });

    if (subscription) {
      return;
    }

    const latestSubscription =
      await this.prisma.subscription.findFirst({
        where: {
          organizationId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          status: true,
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
      subscriptionId:
        latestSubscription?.id ?? null,
      subscriptionStatus:
        latestSubscription?.status ?? null,
      previousPlan:
        latestSubscription?.plan ?? null,
      message:
        'An active subscription is required to access this workspace.',
    });
  }
}