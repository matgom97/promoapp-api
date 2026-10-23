import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service.js';
import { WorkspaceAuthorizationService } from '../../../common/authorization/services/workspace-authorization.service.js';
import { CreateRoleDto } from '../dto/create-role.dto/create-role.dto.js';
import { UpdateRoleDto } from '../dto/update-role.dto/update-role.dto.js';
import { AssignRolePermissionsDto } from '../dto/assign-role-permissions.dto/assign-role-permissions.dto.js';



@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: WorkspaceAuthorizationService,
  ) {}

  /**
   * Lista los roles de una organización.
   */
  async findAll(organizationId: string) {
  return this.prisma.role.findMany({
    where: {
      isActive: true,
      OR: [
        {
          isSystem: true,
          organizationId: null,
          restaurantId: null,
        },
        {
          organizationId,
          restaurantId: null,
        },
      ],
    },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
    orderBy: [
      { isSystem: 'desc' },
      { name: 'asc' },
    ],
  });
}

  /**
   * Consulta un rol específico de una organización.
   */
  async findOne(
    userId: string,
    organizationId: string,
    roleId: string,
  ) {
    await this.assertCanManageRoles(
      userId,
      organizationId,
    );

    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        organizationId,
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        isSystem: true,
        isDefault: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        permissions: {
          select: {
            permission: {
              select: {
                id: true,
                code: true,
                name: true,
                description: true,
                module: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(
        'Role not found in this organization',
      );
    }

    return role;
  }

  /**
   * Crea un rol personalizado.
   */
  async create(
    userId: string,
    organizationId: string,
    dto: CreateRoleDto,
  ) {
    await this.assertCanManageRoles(
      userId,
      organizationId,
    );

    const code = dto.code.trim().toLowerCase();
    const name = dto.name.trim();

    const existing = await this.prisma.role.findFirst({
      where: {
        organizationId,
        code,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new ConflictException(
        'A role with this code already exists in the organization',
      );
    }

    const permissionIds = [
      ...new Set(dto.permissionIds),
    ];

    await this.assertPermissionsExist(permissionIds);

    return this.prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          organizationId,
          code,
          name,
          description: dto.description?.trim() || null,
          isSystem: false,
          isDefault: dto.isDefault ?? false,
          isActive: true,
        },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          isSystem: true,
          isDefault: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId: role.id,
            permissionId,
          })),
        });
      }

      return tx.role.findUniqueOrThrow({
        where: {
          id: role.id,
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    });
  }

  /**
   * Actualiza un rol personalizado.
   */
  async update(
    userId: string,
    organizationId: string,
    roleId: string,
    dto: UpdateRoleDto,
  ) {
    await this.assertCanManageRoles(
      userId,
      organizationId,
    );

    const role = await this.findRoleOrFail(
      organizationId,
      roleId,
    );

    this.assertCustomRole(role.isSystem);

    const data: {
      name?: string;
      description?: string | null;
      isDefault?: boolean;
      isActive?: boolean;
    } = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      data.description = dto.description.trim() || null;
    }

    if (dto.isDefault !== undefined) {
      data.isDefault = dto.isDefault;
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'At least one field must be provided',
      );
    }

    if (dto.isDefault === true) {
      await this.prisma.$transaction(async (tx) => {
        await tx.role.updateMany({
          where: {
            organizationId,
            isDefault: true,
            NOT: { id: roleId },
          },
          data: {
            isDefault: false,
          },
        });

        await tx.role.update({
          where: {
            id: roleId,
          },
          data,
        });
      });

      return this.findOne(
        userId,
        organizationId,
        roleId,
      );
    }

    await this.prisma.role.update({
      where: {
        id: roleId,
      },
      data,
    });

    return this.findOne(
      userId,
      organizationId,
      roleId,
    );
  }

  /**
   * Reemplaza los permisos asignados a un rol.
   */
  async replacePermissions(
    userId: string,
    organizationId: string,
    roleId: string,
    dto: AssignRolePermissionsDto,
  ) {
    await this.assertCanManageRoles(
      userId,
      organizationId,
    );

    const role = await this.findRoleOrFail(
      organizationId,
      roleId,
    );

    this.assertCustomRole(role.isSystem);

    const permissionIds = [
      ...new Set(dto.permissionIds),
    ];

    await this.assertPermissionsExist(permissionIds);

    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: {
          roleId,
        },
      });

      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        });
      }
    });

    return this.findOne(
      userId,
      organizationId,
      roleId,
    );
  }

  /**
   * Elimina un rol personalizado sin miembros asignados.
   */
  async remove(
    userId: string,
    organizationId: string,
    roleId: string,
  ) {
    await this.assertCanManageRoles(
      userId,
      organizationId,
    );

    const role = await this.findRoleOrFail(
      organizationId,
      roleId,
    );

    this.assertCustomRole(role.isSystem);

    if (role.isDefault) {
      throw new BadRequestException(
        'The default role cannot be deleted',
      );
    }

    const assignedMembers =
      await this.prisma.restaurantMember.count({
        where: {
          roleId,
          restaurant: {
            organizationId,
          },
        },
      });

    if (assignedMembers > 0) {
      throw new ConflictException(
        'This role is assigned to members and cannot be deleted',
      );
    }

    await this.prisma.role.delete({
      where: {
        id: roleId,
      },
    });

    return {
      message: 'Role deleted successfully',
    };
  }

  /**
   * Comprueba el permiso de administración de roles.
   */
  private async assertCanManageRoles(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    await this.authorization.assertOrganizationPermission(
      userId,
      organizationId,
      'roles.manage',
    );
  }

  /**
   * Obtiene un rol que pertenece a la organización.
   */
  private async findRoleOrFail(
    organizationId: string,
    roleId: string,
  ) {
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        organizationId,
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        isSystem: true,
        isDefault: true,
        isActive: true,
      },
    });

    if (!role) {
      throw new NotFoundException(
        'Role not found in this organization',
      );
    }

    return role;
  }

  /**
   * Impide modificar roles del sistema.
   */
  private assertCustomRole(isSystem: boolean): void {
    if (isSystem) {
      throw new BadRequestException(
        'System roles cannot be modified or deleted',
      );
    }
  }

  /**
   * Comprueba que todos los permisos existan y estén activos.
   */
  private async assertPermissionsExist(
    permissionIds: string[],
  ): Promise<void> {
    if (permissionIds.length === 0) {
      return;
    }

    const count = await this.prisma.permission.count({
      where: {
        id: {
          in: permissionIds,
        },
        isActive: true,
      },
    });

    if (count !== permissionIds.length) {
      throw new BadRequestException(
        'One or more permissions do not exist or are inactive',
      );
    }
  }
}