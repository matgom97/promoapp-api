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
    organizationId: string,
  ) {
    // Verificar que la organización exista.
    const organization = await this.prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organización no encontrada.');
    }

    

    // Obtener las sedes activas de la organización.
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