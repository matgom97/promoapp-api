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