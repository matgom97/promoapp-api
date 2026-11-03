import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../database/prisma/prisma.service.js';

@Injectable()
export class PromotionSchedulerService {
  private readonly logger = new Logger(PromotionSchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async updateScheduledStatuses() {
    const now = new Date();
    const expired = await this.prisma.promotion.updateMany({
      where: {
        status: { in: ['ACTIVE', 'SCHEDULED'] },
        endsAt: { lte: now },
      },
      data: { status: 'EXPIRED' },
    });
    const activated = await this.prisma.promotion.updateMany({
      where: {
        status: 'SCHEDULED',
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
      },
      data: { status: 'ACTIVE' },
    });
    if (expired.count || activated.count) {
      this.logger.log(`Promotions updated: ${activated.count} activated, ${expired.count} expired`);
    }
  }
}
