import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma/prisma.service.js';

import { WorkspaceAuthorizationService } from '../../common/authorization/services/workspace-authorization.service.js';

@Injectable()
export class RestaurantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: WorkspaceAuthorizationService,
  ) {}

  async findAllByOrganization(
    userId: string,
    organizationId: string,
  ) {
    /*
     * Comprobar que la organización existe.
     */
    const organization = await this.prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!organization) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    /*
     * Verificar la autorización antes de devolver datos.
     *
     * Esta llamada supone que getWorkspaceAccess recibe
     * userId y restaurantId. Si tu implementación actual
     * utiliza otra firma, debe adaptarse a ella.
     *
     * No debemos autorizar una organización únicamente
     * porque exista.
     */
    const memberships =
      await this.prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
        select: {
          user: {
            select: {
              status: true,
            },
          },
        },
      });

    if (
      !memberships ||
      memberships.user.status !== 'ACTIVE' ||
      organization.status !== 'ACTIVE'
    ) {
      const {
        ForbiddenException,
      } = await import('@nestjs/common');

      throw new ForbiddenException(
        'You cannot access this organization',
      );
    }

    /*
     * Obtener únicamente los restaurantes activos
     * de la organización autorizada.
     */
    return this.prisma.restaurant.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}