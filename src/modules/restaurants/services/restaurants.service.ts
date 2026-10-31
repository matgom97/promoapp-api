import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, RestaurantStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service.js';
import { WorkspaceAuthorizationService } from '../../../common/authorization/services/workspace-authorization.service.js';
import { PERMISSIONS } from '../../../common/authorization/constants/permissions.constant.js';
import { CreateRestaurantDto } from '../dto/create-restaurant.dto.js';
import { UpdateRestaurantDto } from '../dto/update-restaurant.dto.js';
import { UpdateRestaurantStatusDto } from '../dto/update-restaurant-status.dto.js';



@Injectable()
export class RestaurantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: WorkspaceAuthorizationService,
  ) { }

  /**
   * Lista las sedes de una organización a las que
   * el usuario autenticado tiene acceso.
   *
   * Este método conserva el caso de uso de la pantalla
   * de usuarios.
   */
  async findAllByOrganization(
    userId: string,
    organizationId: string,
  ) {
    const access =
      await this.authorization.getOrganizationAccess(
        userId,
        organizationId,
      );

    this.assertPermission(
      access.permissions,
      PERMISSIONS.RESTAURANT_VIEW,
    );

    if (access.restaurantIds.length === 0) {
      return [];
    }

    return this.prisma.restaurant.findMany({
      where: {
        organizationId: access.organizationId,
        id: {
          in: access.restaurantIds,
        },
        // No filtrar por status.
        // Necesitamos mostrar ACTIVE, INACTIVE y SUSPENDED.
      },
      select: {
        id: true,
        organizationId: true,

        // Información general
        name: true,
        description: true,
        phone: true,

        // Ubicación
        address: true,
        city: true,
        department: true,
        latitude: true,
        longitude: true,

        // Redes sociales
        website: true,
        instagram: true,
        facebook: true,

        // Estado
        status: true,

        // Fechas
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Consulta una sede concreta.
   */
  async findOne(
    userId: string,
    restaurantId: string,
  ) {
    const access =
      await this.authorization.assertRestaurantPermission(
        userId,
        restaurantId,
        PERMISSIONS.RESTAURANT_BRANCH_VIEW,
      );

    return this.prisma.restaurant.findFirst({
      where: {
        id: access.restaurantId,
        organizationId: access.organizationId,
        status: 'ACTIVE',
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
        cuisineId: true,
        priceRangeId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Crea una sede dentro de una organización autorizada.
   *
   * La organización se obtiene de la ruta, pero se valida
   * mediante el servicio de autorización antes de escribir.
   */
  async create(
    userId: string,
    organizationId: string,
    dto: CreateRestaurantDto,
  ) {
    await this.authorization.assertOrganizationPermission(
      userId,
      organizationId,
      PERMISSIONS.RESTAURANT_CREATE,
    );

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();

      const subscription =
        await tx.subscription.findFirst({
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
            plan: {
              select: {
                maxRestaurants: true,
              },
            },
          },
        });

      if (!subscription) {
        throw new ForbiddenException({
          code: 'SUBSCRIPTION_REQUIRED',
          message:
            'An active subscription is required to create a restaurant.',
        });
      }

      const maxRestaurants =
        subscription.plan.maxRestaurants;

      /*
       * maxRestaurants === null significa sin límite
       * numérico en esta implementación.
       */
      if (maxRestaurants !== null) {
        const restaurantCount =
          await tx.restaurant.count({
            where: {
              organizationId,
            },
          });

        if (restaurantCount >= maxRestaurants) {
          throw new ForbiddenException({
            code: 'RESTAURANT_LIMIT_REACHED',
            limit: maxRestaurants,
            current: restaurantCount,
            message:
              'Your subscription does not allow creating more restaurants.',
          });
        }
      }

      const restaurant =
        await tx.restaurant.create({
          data: {
            organizationId,
            name: dto.name.trim(),
            description: dto.description?.trim(),
            phone: dto.phone?.trim(),
            address: dto.address.trim(),
            city: dto.city.trim(),
            department: dto.department?.trim(),
            latitude:
              dto.latitude !== undefined
                ? new Prisma.Decimal(dto.latitude)
                : undefined,
            longitude:
              dto.longitude !== undefined
                ? new Prisma.Decimal(dto.longitude)
                : undefined,
            website: dto.website?.trim(),
            instagram: dto.instagram?.trim(),
            facebook: dto.facebook?.trim(),
            status: RestaurantStatus.ACTIVE,
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
        });

      return restaurant;
    });
  }

  /**
   * Actualiza los datos de una sede.
   */
  async update(
    userId: string,
    restaurantId: string,
    dto: UpdateRestaurantDto,
  ) {
    const access =
      await this.authorization.assertRestaurantPermission(
        userId,
        restaurantId,
        PERMISSIONS.RESTAURANT_BRANCH_UPDATE,
      );

    const data: Prisma.RestaurantUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      data.description = dto.description?.trim() || null;
    }

    if (dto.phone !== undefined) {
      data.phone = dto.phone?.trim() || null;
    }

    if (dto.address !== undefined) {
      data.address = dto.address.trim();
    }

    if (dto.city !== undefined) {
      data.city = dto.city.trim();
    }

    if (dto.department !== undefined) {
      data.department = dto.department?.trim() || null;
    }

    if (dto.latitude !== undefined) {
      data.latitude = new Prisma.Decimal(dto.latitude);
    }

    if (dto.longitude !== undefined) {
      data.longitude = new Prisma.Decimal(dto.longitude);
    }

    if (dto.website !== undefined) {
      data.website = dto.website?.trim() || null;
    }

    if (dto.instagram !== undefined) {
      data.instagram = dto.instagram?.trim() || null;
    }

    if (dto.facebook !== undefined) {
      data.facebook = dto.facebook?.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'At least one field must be provided',
      );
    }

    /*
     * La actualización se limita simultáneamente por
     * el identificador de la sede y su organización.
     */
    const result =
      await this.prisma.restaurant.updateMany({
        where: {
          id: access.restaurantId,
          organizationId: access.organizationId,
          status: 'ACTIVE',
        },
        data,
      });

    if (result.count === 0) {
      throw new NotFoundException(
        'Restaurant not found',
      );
    }

    return this.prisma.restaurant.findFirstOrThrow({
      where: {
        id: access.restaurantId,
        organizationId: access.organizationId,
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
        updatedAt: true,
      },
    });
  }

  /**
   * Activa o desactiva una sede.
   */
  async updateStatus(
    userId: string,
    restaurantId: string,
    dto: UpdateRestaurantStatusDto,
  ) {
    const access =
      await this.authorization.getRestaurantStatusAccess(
        userId,
        restaurantId,
      );

    this.assertPermission(
      access.permissions,
      PERMISSIONS.RESTAURANT_BRANCH_STATUS_UPDATE,
    );

    const result =
      await this.prisma.restaurant.updateMany({
        where: {
          id: access.restaurantId,
          organizationId: access.organizationId,
          status: {
            in: [
              RestaurantStatus.ACTIVE,
              RestaurantStatus.INACTIVE,
            ],
          },
        },
        data: {
          status: dto.status,
        },
      });

    if (result.count === 0) {
      throw new NotFoundException(
        'Restaurant not found or cannot be modified',
      );
    }

    return this.prisma.restaurant.findFirstOrThrow({
      where: {
        id: access.restaurantId,
        organizationId: access.organizationId,
      },
      select: {
        id: true,
        organizationId: true,
        name: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Comprueba que la lista de permisos incluya
   * el permiso requerido.
   */
  private assertPermission(
    permissions: string[],
    requiredPermission: string,
  ): void {
    if (!permissions.includes(requiredPermission)) {
      throw new ForbiddenException({
        code: 'MISSING_PERMISSION',
        requiredPermission,
        message:
          'You do not have permission to perform this action.',
      });
    }
  }
}