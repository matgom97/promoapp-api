import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../database/prisma/prisma.service.js';

@Injectable()
export class SubscriptionRenewalService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Prepara una renovación sin iniciar un cobro.
   *
   * La suscripción anterior permanece ACTIVE hasta que termina
   * su período. Si ya venció, se conserva como EXPIRED.
   *
   * La nueva suscripción queda PENDING y vinculada a la anterior.
   */
  async prepareRenewal(subscriptionId: string) {
    return this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const locked = await tx.$queryRaw<
          { id: string }[]
        >`
          SELECT id
          FROM subscriptions
          WHERE id = ${subscriptionId}
          FOR UPDATE
        `;

        if (locked.length === 0) {
          throw new NotFoundException(
            'Subscription not found',
          );
        }

        const current =
          await tx.subscription.findUnique({
            where: {
              id: subscriptionId,
            },
            include: {
              renewals: {
                select: {
                  id: true,
                  status: true,
                  planId: true,
                  createdAt: true,
                  payments: {
                    select: {
                      id: true,
                      status: true,
                    },
                  },
                },
              },
              plan: {
                select: {
                  id: true,
                  isActive: true,
                  requiresPayment: true,
                },
              },
              scheduledPlan: {
                select: {
                  id: true,
                  isActive: true,
                  requiresPayment: true,
                },
              },
            },
          });

        if (!current) {
          throw new NotFoundException(
            'Subscription not found',
          );
        }

        const now = new Date();

        if (
          current.status !== 'ACTIVE' &&
          current.status !== 'EXPIRED'
        ) {
          throw new ConflictException(
            'Only active or expired subscriptions can be renewed',
          );
        }

        if (
          current.status === 'ACTIVE' &&
          (
            !current.currentPeriodEnd ||
            current.currentPeriodEnd > now
          )
        ) {
          throw new ConflictException(
            'The current subscription period has not ended',
          );
        }

        /*
         * Recupera una renovación anterior en lugar de crear
         * otra. Una renovación pendiente no se duplica, aunque
         * su pago haya sido rechazado o todavía no exista.
         */
        const existingRenewal =
          current.renewals.find(
            (renewal) =>
              renewal.status === 'PENDING' ||
              renewal.status === 'ACTIVE',
          );

        if (existingRenewal) {
          return {
            message: 'Renewal already exists',
            data: {
              id: existingRenewal.id,
              status: existingRenewal.status,
              planId: existingRenewal.planId,
              paymentStatus:
                existingRenewal.payments
                  .map((payment) => payment.status)
                  .sort((a, b) => {
                    if (a === 'PENDING') return -1;
                    if (b === 'PENDING') return 1;
                    return 0;
                  })[0] ?? null,
              reused: true,
            },
          };
        }

        /*
         * El cambio programado tiene prioridad.
         * La suscripción original conserva ese valor hasta
         * que la renovación haya sido activada correctamente.
         */
        const nextPlanId =
          current.scheduledPlanId ?? current.planId;

        const nextPlan = await tx.plan.findFirst({
          where: {
            id: nextPlanId,
            isActive: true,
            requiresPayment: true,
          },
          select: {
            id: true,
          },
        });

        if (!nextPlan) {
          throw new NotFoundException(
            'The renewal plan does not exist, is inactive, or does not require payment',
          );
        }

        /*
         * Si existe una suscripción activa diferente con
         * período vigente, no preparamos otra renovación.
         */
        const anotherActive =
          await tx.subscription.findFirst({
            where: {
              organizationId: current.organizationId,
              status: 'ACTIVE',
              id: {
                not: current.id,
              },
              currentPeriodEnd: {
                gt: now,
              },
            },
            select: {
              id: true,
            },
          });

        if (anotherActive) {
          throw new ConflictException(
            'Another active subscription exists for this organization',
          );
        }

        /*
         * La restricción UNIQUE sobre renewalOfSubscriptionId
         * constituye la protección adicional contra duplicados.
         */
        const renewal =
          await tx.subscription.create({
            data: {
              organizationId: current.organizationId,
              restaurantId: current.restaurantId,
              planId: nextPlan.id,
              renewalOfSubscriptionId: current.id,
              status: 'PENDING',
              startsAt:
                current.currentPeriodEnd ?? now,
            },
            select: {
              id: true,
              status: true,
              planId: true,
              renewalOfSubscriptionId: true,
            },
          });

        /*
         * Solo expira la suscripción anterior si su período
         * terminó. No se adelanta el vencimiento.
         */
        if (
          current.status === 'ACTIVE' &&
          current.currentPeriodEnd &&
          current.currentPeriodEnd <= now
        ) {
          await tx.subscription.updateMany({
            where: {
              id: current.id,
              status: 'ACTIVE',
              currentPeriodEnd: {
                lte: now,
              },
            },
            data: {
              status: 'EXPIRED',
            },
          });
        }

        return {
          message: 'Renewal prepared successfully',
          data: {
            ...renewal,
            reused: false,
          },
        };
      },
    );
  }
}