import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service.js';

@Injectable()
export class PriceRangesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.priceRange.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
      select: {
        code: true,
        symbol: true,
        name: true,
      },
    });
  }
}