import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service.js';

@Injectable()
export class CuisinesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.cuisine.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
      select: {
        code: true,
        name: true,
      },
    });
  }
}