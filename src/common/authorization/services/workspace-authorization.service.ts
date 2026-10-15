import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../database/prisma/prisma.service.js';

import {
  SYSTEM_ROLE_PERMISSIONS,
} from '../constants/role-permissions.constant.js';

@Injectable()
export class WorkspaceAuthorizationService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getPermissions(
    userId: string,
    restaurantId: string,
  ): Promise<string[]> {
    /*
     * 1. Validar la membresía del usuario y obtener
     * la organización propietaria del restaurante.
     */

    const membership =
      await this.prisma.restaurantMember.findFirst({
        where: {
          userId,
          restaurantId,
          restaurant: {
            status: 'ACTIVE',
          },
          user: {
            status: 'ACTIVE',
          },
        },
        select: {
          id: true,
          role: true,

          restaurant: {
            select: {
              organizationId: true,
            },
          },

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

    if (!membership) {
      throw new NotFoundException(
        'Active workspace membership not found',
      );
    }

    /*
     * 2. Consultar la suscripción más reciente
     * de la organización.
     *
     * La suscripción es compartida por los
     * restaurantes de la organización.
     */

    const subscription =
      await this.prisma.subscription.findFirst({
        where: {
          organizationId:
            membership.restaurant.organizationId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          status: true,
          currentPeriodEnd: true,
        },
      });

    /*
     * 3. Verificar que exista una suscripción.
     */

    if (!subscription) {
      throw new ForbiddenException({
        code: 'SUBSCRIPTION_REQUIRED',
        message:
          'The organization does not have a subscription.',
      });
    }

    /*
     * 4. Validar el estado y la vigencia.
     *
     * No se permiten suscripciones PENDING,
     * PAST_DUE, CANCELED o EXPIRED.
     *
     * Una suscripción ACTIVE debe tener una fecha
     * de vencimiento válida y futura.
     */

    const now = new Date();

    const hasActiveSubscription =
      subscription.status === 'ACTIVE' &&
      subscription.currentPeriodEnd !== null &&
      subscription.currentPeriodEnd > now;

    if (!hasActiveSubscription) {
      throw new ForbiddenException({
        code: 'SUBSCRIPTION_ACCESS_DENIED',
        subscriptionStatus: subscription.status,
        message:
          'An active and valid subscription is required to access this workspace.',
      });
    }

    /*
     * 5. Resolver los permisos del usuario.
     *
     * La suscripción habilita el acceso al producto,
     * pero no sustituye los permisos del usuario.
     */

    const customRole = membership.customRole;

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
      SYSTEM_ROLE_PERMISSIONS[membership.role];

    if (!permissions) {
      throw new ForbiddenException(
        'The assigned role has no permission configuration',
      );
    }

    return [...new Set(permissions)];
  }
}