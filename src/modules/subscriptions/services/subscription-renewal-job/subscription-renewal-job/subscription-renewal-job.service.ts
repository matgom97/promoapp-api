import {
  Injectable,
  Logger,
} from '@nestjs/common';

import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../../../database/prisma/prisma.service.js';
import { SubscriptionRenewalService } from '../../subscription-renewal/subscription-renewal.service.js';





@Injectable()
export class SubscriptionRenewalJobService {
  private readonly logger = new Logger(
    SubscriptionRenewalJobService.name,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly renewalService: SubscriptionRenewalService,
  ) {}

  /**
   * Ejecuta la revisión cada hora.
   *
   * No realiza cobros. Únicamente prepara renovaciones
   * para suscripciones cuyo período ya terminó.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processExpiredSubscriptions(): Promise<void> {
    this.logger.log(
      'Starting expired subscription scan',
    );

    const now = new Date();

    const expiredSubscriptions =
      await this.prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
          currentPeriodEnd: {
            lte: now,
          },
        },
        select: {
          id: true,
        },
        orderBy: {
          currentPeriodEnd: 'asc',
        },
        take: 100,
      });

    let processed = 0;
    let failed = 0;

    for (const subscription of expiredSubscriptions) {
      try {
        const result =
          await this.renewalService.prepareRenewal(
            subscription.id,
          );

        this.logger.log(
          `Subscription ${subscription.id}: ${result.message}`,
        );

        processed++;
      } catch (error: unknown) {
        failed++;

        const message =
          error instanceof Error
            ? error.message
            : 'Unknown error';

        this.logger.error(
          `Failed to prepare renewal for subscription ${subscription.id}: ${message}`,
        );
      }
    }

    this.logger.log(
      `Expired subscription scan completed. Found: ${expiredSubscriptions.length}; processed: ${processed}; failed: ${failed}`,
    );
  }
}