import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import * as argon2 from 'argon2';

import { Prisma, type PrismaClient } from '@prisma/client';

import { PrismaService } from '../../../database/prisma/prisma.service.js';

import {
  QueryOrganizationMembersDto,
} from '../dto/query-organization-members.dto/query-organization-members.dto.js';

import {
  CreateOrganizationMemberDto,
} from '../dto/create-organization-member.dto/create-organization-member.dto.js';

import {
  UpdateOrganizationMemberDto,
} from '../dto/update-organization-member.dto/update-organization-member.dto.js';

import {
  AssignRestaurantsDto,
} from '../dto/assign-restaurants.dto/assign-restaurants.dto.js';

import {
  PlanLimitsService,
} from '../../plan-access/application/services/plan-limits.service.js';

import {
  FeatureAccessService,
} from '../../plan-access/application/services/feature-access.service.js';

@Injectable()
export class OrganizationMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planLimitsService: PlanLimitsService,
    private readonly featureAccessService: FeatureAccessService,
  ) { }

  // =====================================================
  // AUTORIZACIÓN
  // =====================================================

  private async assertCanManageMembers(
    actorId: string,
    organizationId: string,
  ) {
    const membership =
      await this.prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: actorId,
            organizationId,
          },
        },
        select: {
          id: true,
          role: true,
          user: {
            select: {
              status: true,
            },
          },
          organization: {
            select: {
              status: true,
            },
          },
        },
      });

    if (
      !membership ||
      membership.user.status !== 'ACTIVE' ||
      membership.organization.status !== 'ACTIVE'
    ) {
      throw new ForbiddenException(
        'You cannot manage members of this organization',
      );
    }

    if (
      membership.role !== 'OWNER' &&
      membership.role !== 'ADMIN'
    ) {
      throw new ForbiddenException(
        'You do not have permission to manage organization members',
      );
    }

    return membership;
  }

  // =====================================================
  // VALIDACIÓN DE FUNCIONALIDAD DEL PLAN
  // =====================================================

  private async assertTeamMembersFeature(
    organizationId: string,
  ): Promise<void> {
    await this.featureAccessService.assertFeatureEnabled(
      organizationId,
      'TEAM_MEMBERS',
    );
  }

  // =====================================================
  // VALIDACIÓN DE RESTAURANTES
  // =====================================================

  private async assertRestaurantsBelongToOrganization(
    organizationId: string,
    restaurantIds: string[],
  ): Promise<string[]> {
    const uniqueIds = [...new Set(restaurantIds)];

    if (uniqueIds.length === 0) {
      throw new BadRequestException(
        'At least one restaurant must be selected',
      );
    }

    const restaurants =
      await this.prisma.restaurant.findMany({
        where: {
          id: {
            in: uniqueIds,
          },
          organizationId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
        },
      });

    if (restaurants.length !== uniqueIds.length) {
      throw new BadRequestException(
        'One or more restaurants are invalid, inactive, or belong to another organization',
      );
    }

    return uniqueIds;
  }

  // =====================================================
  // LISTAR MIEMBROS
  // =====================================================

  async findAll(
    actorId: string,
    organizationId: string,
    query: QueryOrganizationMembersDto,
  ) {
    await this.assertCanManageMembers(
      actorId,
      organizationId,
    );

    const {
      restaurantIds,
      role,
      allRestaurants,
      page = 1,
      limit = 20,
    } = query;

    let assignedUserIds: string[] = [];

    if (restaurantIds?.length) {
      const validRestaurantIds =
        await this.assertRestaurantsBelongToOrganization(
          organizationId,
          restaurantIds,
        );

      const assignments =
        await this.prisma.restaurantMember.findMany({
          where: {
            restaurantId: {
              in: validRestaurantIds,
            },
            restaurant: {
              organizationId,
            },
          },
          select: {
            userId: true,
          },
          distinct: ['userId'],
        });

      assignedUserIds = assignments.map(
        (assignment) => assignment.userId,
      );
    }

    const where: Prisma.OrganizationMemberWhereInput = {
      organizationId,

      ...(role !== undefined
        ? { role }
        : {}),

      ...(allRestaurants !== undefined
        ? { allRestaurants }
        : {}),

      ...(restaurantIds?.length
        ? {
          OR: [
            {
              allRestaurants: true,
            },
            {
              userId: {
                in: assignedUserIds,
              },
            },
          ],
        }
        : {}),
    };

    const [total, members] =
      await this.prisma.$transaction([
        this.prisma.organizationMember.count({
          where,
        }),

        this.prisma.organizationMember.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            userId: true,
            role: true,
            allRestaurants: true,
            createdAt: true,
            updatedAt: true,

            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                status: true,
              },
            },
          },
        }),
      ]);

    const memberIds = members.map(
      (member) => member.userId,
    );

    const restaurantMemberships =
      memberIds.length > 0
        ? await this.prisma.restaurantMember.findMany({
          where: {
            userId: {
              in: memberIds,
            },
            restaurant: {
              organizationId,
            },
          },
          select: {
            userId: true,
            restaurantId: true,
            role: true,
            roleId: true,

            restaurant: {
              select: {
                name: true,
                status: true,
              },
            },
          },
        })
        : [];

    const assignmentsByUser = new Map<
      string,
      typeof restaurantMemberships
    >();

    for (const assignment of restaurantMemberships) {
      const current =
        assignmentsByUser.get(assignment.userId) ?? [];

      current.push(assignment);

      assignmentsByUser.set(
        assignment.userId,
        current,
      );
    }

    const roles = await this.prisma.role.findMany({
      select: {
        code: true,
        name: true,
      },
    });

    const roleNames = new Map(
      roles.map((role) => [role.code, role.name]),
    );

    return {
      data: members.map((member) => ({
        id: member.id,
        userId: member.userId,
        role: member.role,
        roleName: roleNames.get(member.role) ?? member.role,
        allRestaurants: member.allRestaurants,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,

        user: member.user,

        restaurants: member.allRestaurants
          ? []
          : (
            assignmentsByUser.get(member.userId) ?? []
          ).map((assignment) => ({
            id: assignment.restaurantId,
            name: assignment.restaurant.name,
            status: assignment.restaurant.status,
            role: assignment.role,
            roleId: assignment.roleId,
          })),
      })),

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // =====================================================
  // CONSULTAR UN MIEMBRO
  // =====================================================

  async findOne(
    actorId: string,
    organizationId: string,
    memberId: string,
  ) {
    await this.assertCanManageMembers(
      actorId,
      organizationId,
    );

    const member =
      await this.prisma.organizationMember.findFirst({
        where: {
          id: memberId,
          organizationId,
        },
        select: {
          id: true,
          userId: true,
          role: true,
          allRestaurants: true,
          createdAt: true,
          updatedAt: true,

          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              status: true,
            },
          },
        },
      });

    if (!member) {
      throw new NotFoundException(
        'Organization member not found',
      );
    }

    const assignments =
      await this.prisma.restaurantMember.findMany({
        where: {
          userId: member.userId,
          restaurant: {
            organizationId,
          },
        },
        select: {
          id: true,
          restaurantId: true,
          role: true,
          roleId: true,

          restaurant: {
            select: {
              name: true,
              status: true,
            },
          },
        },
      });

    return {
      ...member,

      restaurants: member.allRestaurants
        ? []
        : assignments.map((assignment) => ({
          id: assignment.restaurantId,
          name: assignment.restaurant.name,
          status: assignment.restaurant.status,
          role: assignment.role,
          roleId: assignment.roleId,
        })),
    };
  }

  // =====================================================
  // INCORPORAR UN USUARIO EXISTENTE
  // =====================================================

  async create(
    actorId: string,
    organizationId: string,
    dto: CreateOrganizationMemberDto,
  ) {
    await this.assertCanManageMembers(
      actorId,
      organizationId,
    );

    await this.assertTeamMembersFeature(organizationId);

    if (dto.role === 'OWNER') {
      throw new BadRequestException(
        'Use the ownership transfer process to assign the OWNER role',
      );
    }

    if (
      !dto.allRestaurants &&
      (!dto.restaurantIds || dto.restaurantIds.length === 0)
    ) {
      throw new BadRequestException(
        'Select at least one restaurant or enable access to all restaurants',
      );
    }

    const email = dto.email.trim().toLowerCase();

    const restaurantIds = dto.allRestaurants
      ? []
      : await this.assertRestaurantsBelongToOrganization(
        organizationId,
        dto.restaurantIds ?? [],
      );

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (
      existingUser &&
      existingUser.status !== 'ACTIVE'
    ) {
      throw new BadRequestException(
        'This user account is not active',
      );
    }

    if (!existingUser && !dto.password) {
      throw new BadRequestException(
        'A password is required when creating a new user',
      );
    }

    const passwordHash = existingUser
      ? undefined
      : await argon2.hash(dto.password!, {
        type: argon2.argon2id,
      });

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          /*
           * Serializa las operaciones que intenten modificar
           * los miembros de esta misma organización, siempre
           * que utilicen este mismo protocolo de bloqueo.
           */
          const organizations = await tx.$queryRaw<
            Array<{ id: string }>
          >`
          SELECT id
          FROM organizations
          WHERE id = ${organizationId}
          FOR UPDATE
        `;

          if (organizations.length === 0) {
            throw new NotFoundException(
              'Organization not found',
            );
          }

          /*
           * Volver a comprobar la membresía del actor dentro
           * de la transacción evita depender exclusivamente
           * de la validación previa.
           */
          const actorMembership =
            await tx.organizationMember.findUnique({
              where: {
                userId_organizationId: {
                  userId: actorId,
                  organizationId,
                },
              },
              select: {
                role: true,
                user: {
                  select: {
                    status: true,
                  },
                },
                organization: {
                  select: {
                    status: true,
                  },
                },
              },
            });

          if (
            !actorMembership ||
            actorMembership.user.status !== 'ACTIVE' ||
            actorMembership.organization.status !== 'ACTIVE' ||
            !['OWNER', 'ADMIN'].includes(
              actorMembership.role,
            )
          ) {
            throw new ForbiddenException(
              'You cannot manage members of this organization',
            );
          }

          /*
           * Comprobar el plan y el cupo dentro de la misma
           * transacción que crea la membresía.
           */
          const plan =
            await this.planLimitsService.getOrganizationPlan(
              organizationId,
            );

          const currentUsers =
            await tx.organizationMember.count({
              where: {
                organizationId,
              },
            });

          if (
            plan.limits.maxUsers !== null &&
            currentUsers >= plan.limits.maxUsers
          ) {
            throw new ForbiddenException({
              code: 'PLAN_LIMIT_REACHED',
              message:
                'La organización alcanzó el límite de usuarios de su plan.',
              limit: 'maxUsers',
              maximum: plan.limits.maxUsers,
              current: currentUsers,
              plan: plan.planCode,
            });
          }

          /*
           * Resolver el usuario dentro de la transacción.
           * La restricción única de email sigue siendo la
           * garantía definitiva contra duplicados.
           */
          const user = existingUser
            ? await tx.user.findUnique({
              where: {
                id: existingUser.id,
              },
              select: {
                id: true,
                status: true,
              },
            })
            : await tx.user.create({
              data: {
                email,
                firstName: dto.firstName.trim(),
                passwordHash: passwordHash!,
                status: 'ACTIVE',
              },
              select: {
                id: true,
                status: true,
              },
            });

          if (!user || user.status !== 'ACTIVE') {
            throw new BadRequestException(
              'This user account is not active',
            );
          }

          const existingMembership =
            await tx.organizationMember.findUnique({
              where: {
                userId_organizationId: {
                  userId: user.id,
                  organizationId,
                },
              },
              select: {
                id: true,
              },
            });

          if (existingMembership) {
            throw new ConflictException(
              'This user already belongs to the organization',
            );
          }

          const member =
            await tx.organizationMember.create({
              data: {
                userId: user.id,
                organizationId,
                role: dto.role,
                allRestaurants: dto.allRestaurants,
              },
              select: {
                id: true,
                userId: true,
                organizationId: true,
                role: true,
                allRestaurants: true,
                createdAt: true,
              },
            });

          if (restaurantIds.length > 0) {
            await tx.restaurantMember.createMany({
              data: restaurantIds.map((restaurantId) => ({
                userId: user.id,
                restaurantId,
                role: dto.role,
              })),
            });
          }

          return member;
        },
        {
          maxWait: 5000,
          timeout: 10000,
        },
      );
    } catch (error) {
      /*
       * Traducir conflictos de restricciones únicas a una
       * respuesta HTTP consistente.
       */
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This user or membership already exists',
        );
      }

      throw error;
    }
  }

  // =====================================================
  // ACTUALIZAR ROL Y ACCESOS
  // =====================================================

  async update(
    actorId: string,
    organizationId: string,
    memberId: string,
    dto: UpdateOrganizationMemberDto,
  ) {
    const actor = await this.assertCanManageMembers(
      actorId,
      organizationId,
    );

    await this.assertTeamMembersFeature(organizationId);

    const member =
      await this.prisma.organizationMember.findFirst({
        where: {
          id: memberId,
          organizationId,
        },
        select: {
          id: true,
          userId: true,
          role: true,
          allRestaurants: true,
        },
      });

    if (!member) {
      throw new NotFoundException(
        'Organization member not found',
      );
    }

    if (
      member.role === 'OWNER' &&
      actor.role !== 'OWNER'
    ) {
      throw new ForbiddenException(
        'Only the organization owner can modify the owner membership',
      );
    }

    if (dto.role === 'OWNER') {
      throw new BadRequestException(
        'Use the ownership transfer process to assign the OWNER role',
      );
    }

    const nextAllRestaurants =
      dto.allRestaurants ?? member.allRestaurants;

    let restaurantIds: string[] | undefined;

    if (nextAllRestaurants) {
      restaurantIds = [];
    } else if (dto.restaurantIds !== undefined) {
      restaurantIds =
        dto.restaurantIds.length === 0
          ? []
          : await this.assertRestaurantsBelongToOrganization(
            organizationId,
            dto.restaurantIds,
          );
    } else if (member.allRestaurants) {
      throw new BadRequestException(
        'Provide restaurantIds when changing from global access to restricted access',
      );
    }

    if (
      !nextAllRestaurants &&
      restaurantIds !== undefined &&
      restaurantIds.length === 0
    ) {
      throw new BadRequestException(
        'At least one restaurant must be assigned when global access is disabled',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated =
        await tx.organizationMember.update({
          where: {
            id: member.id,
          },
          data: {
            ...(dto.role !== undefined
              ? {
                role: dto.role,
              }
              : {}),

            allRestaurants: nextAllRestaurants,
          },
          select: {
            id: true,
            userId: true,
            organizationId: true,
            role: true,
            allRestaurants: true,
            updatedAt: true,
          },
        });

      if (dto.password !== undefined) {
        const passwordHash = await argon2.hash(
          dto.password,
          {
            type: argon2.argon2id,
          },
        );

        await tx.user.update({
          where: {
            id: member.userId,
          },
          data: {
            passwordHash,
          },
        });
      }

      if (nextAllRestaurants) {
        await tx.restaurantMember.deleteMany({
          where: {
            userId: member.userId,
            restaurant: {
              organizationId,
            },
          },
        });
      } else if (restaurantIds !== undefined) {
        await tx.restaurantMember.deleteMany({
          where: {
            userId: member.userId,
            restaurant: {
              organizationId,
            },
          },
        });

        await tx.restaurantMember.createMany({
          data: restaurantIds.map((restaurantId) => ({
            userId: member.userId,
            restaurantId,
            role: dto.role ?? member.role,
          })),
        });
      } else if (dto.role !== undefined) {
        await tx.restaurantMember.updateMany({
          where: {
            userId: member.userId,
            restaurant: {
              organizationId,
            },
          },
          data: {
            role: dto.role,
          },
        });
      }

      return updated;
    });
  }

  // =====================================================
  // ASIGNAR RESTAURANTES
  // =====================================================

  async assignRestaurants(
    actorId: string,
    organizationId: string,
    memberId: string,
    dto: AssignRestaurantsDto,
  ) {
    return this.update(
      actorId,
      organizationId,
      memberId,
      {
        allRestaurants: dto.allRestaurants,
        restaurantIds: dto.restaurantIds,
      },
    );
  }

  // =====================================================
  // REVOCAR MEMBRESÍA
  // =====================================================

  async remove(
    actorId: string,
    organizationId: string,
    memberId: string,
  ) {
    await this.assertCanManageMembers(
      actorId,
      organizationId,
    );

    await this.assertTeamMembersFeature(organizationId);

    const member =
      await this.prisma.organizationMember.findFirst({
        where: {
          id: memberId,
          organizationId,
        },
        select: {
          id: true,
          userId: true,
          role: true,
        },
      });

    if (!member) {
      throw new NotFoundException(
        'Organization member not found',
      );
    }

    if (member.role === 'OWNER') {
      throw new ForbiddenException(
        'The organization owner cannot be removed',
      );
    }

    if (member.userId === actorId) {
      throw new ForbiddenException(
        'You cannot remove yourself from the organization',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.restaurantMember.deleteMany({
        where: {
          userId: member.userId,
          restaurant: {
            organizationId,
          },
        },
      });

      await tx.organizationMember.delete({
        where: {
          id: member.id,
        },
      });
    });

    return {
      message: 'Organization member removed successfully',
    };
  }
}