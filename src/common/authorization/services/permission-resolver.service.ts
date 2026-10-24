import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../../../database/prisma/prisma.service.js';

import {
  SYSTEM_ROLE_PERMISSIONS,
} from '../constants/role-permissions.constant.js';

type SystemRole = keyof typeof SYSTEM_ROLE_PERMISSIONS;

@Injectable()
export class PermissionResolverService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Resuelve los permisos de una membresía de restaurante.
   *
   * Si existe un rol personalizado, utiliza exclusivamente
   * los permisos de ese rol.
   *
   * Si no existe un rol personalizado, utiliza los permisos
   * definidos para el rol del sistema.
   */
  async resolveRestaurantPermissions(
    restaurantMemberId: string,
    role: string,
    customRoleId: string | null,
  ): Promise<string[]> {
    if (customRoleId) {
      const customRole = await this.prisma.role.findFirst({
        where: {
          id: customRoleId,
          isActive: true,
          restaurant: {
            memberships: {
              some: {
                id: restaurantMemberId,
              },
            },
          },
        },
        select: {
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
      });

      if (!customRole) {
        throw new ForbiddenException({
          code: 'INVALID_CUSTOM_ROLE',
          message: 'The assigned custom role is invalid or inactive.',
        });
      }

      return [
        ...new Set(
          customRole.permissions.map(
            ({ permission }) => permission.code,
          ),
        ),
      ];
    }

    return this.resolveSystemRolePermissions(role);
  }

  /**
   * Resuelve los permisos de un rol del sistema.
   *
   * Los roles desconocidos no reciben permisos.
   */
  resolveSystemRolePermissions(
    role: string,
  ): string[] {
    if (
      !Object.prototype.hasOwnProperty.call(
        SYSTEM_ROLE_PERMISSIONS,
        role,
      )
    ) {
      throw new ForbiddenException({
        code: 'INVALID_SYSTEM_ROLE',
        message: 'The assigned system role is invalid.',
      });
    }

    const permissions =
      SYSTEM_ROLE_PERMISSIONS[role as SystemRole];

    return [...new Set(permissions)];
  }
}