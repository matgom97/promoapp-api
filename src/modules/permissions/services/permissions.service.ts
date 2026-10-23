import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service.js';


@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(module?: string) {
    return this.prisma.permission.findMany({
      where: {
        isActive: true,
        ...(module ? { module } : {}),
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        module: true,
      },
      orderBy: [
        { module: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async findModules() {
    const permissions = await this.prisma.permission.findMany({
      where: { isActive: true },
      select: { module: true },
      distinct: ['module'],
      orderBy: { module: 'asc' },
    });

    return permissions.map((item) => item.module);
  }
}