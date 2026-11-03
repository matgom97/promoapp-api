import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import {
  PromotionFrequency,
  PromotionStatus,
  PromotionType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service.js';
import { WorkspaceAuthorizationService } from '../../../common/authorization/services/workspace-authorization.service.js';
import { FeatureAccessService } from '../../plan-access/application/services/feature-access.service.js';
import { PlanLimitsService } from '../../plan-access/application/services/plan-limits.service.js';
import { CreatePromotionDto } from '../dto/create-promotion.dto.js';

const tokenHash = (token: string) =>
  createHash('sha256').update(token).digest('hex');

@Injectable()
export class PromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: WorkspaceAuthorizationService,
    private readonly featureAccess: FeatureAccessService,
    private readonly planLimits: PlanLimitsService,
  ) {}

  async list(userId: string, organizationId: string) {
    await this.requireOrganizationPermission(userId, organizationId, 'promotions.view');
    await this.featureAccess.assertFeatureEnabled(organizationId, 'PROMOTIONS_BASIC');
    return this.prisma.promotion.findMany({
      where: { organizationId },
      include: {
        category: true,
        restaurants: { include: { restaurant: { select: { id: true, name: true, status: true } } } },
        schedules: true,
        images: { orderBy: { sortOrder: 'asc' } },
        usageRule: true,
        _count: { select: { redemptions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(userId: string, organizationId: string, promotionId: string) {
    await this.requireOrganizationPermission(userId, organizationId, 'promotions.view');
    const promotion = await this.prisma.promotion.findFirst({
      where: { id: promotionId, organizationId },
      include: {
        category: true,
        restaurants: { include: { restaurant: true } },
        schedules: true,
        usageRule: true,
        images: true,
        _count: { select: { redemptions: true } },
      },
    });
    if (!promotion) throw new NotFoundException('Promotion not found');
    return promotion;
  }

  async listOffers(organizationId: string) {
    await this.featureAccess.assertFeatureEnabled(organizationId, 'PROMOTIONS_BASIC');
    const now = new Date();
    return this.prisma.promotion.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        archivedAt: null,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        ],
        restaurants: { some: { restaurant: { status: 'ACTIVE' } } },
      },
      select: {
        id: true,
        name: true,
        shortDescription: true,
        description: true,
        coverImageUrl: true,
        benefitDescription: true,
        type: true,
        startsAt: true,
        endsAt: true,
        restaurants: {
          where: { restaurant: { status: 'ACTIVE' } },
          select: { restaurant: { select: { id: true, name: true, city: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async registerCustomerProfile(userId: string, organizationId: string, acceptPrivacy: boolean) {
    if (acceptPrivacy !== true) throw new BadRequestException('Privacy notice acceptance is required');
    const [user, organization] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true, status: true },
      }),
      this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, status: true },
      }),
    ]);
    if (!user || user.status !== 'ACTIVE') throw new NotFoundException('User not found');
    if (!organization || organization.status !== 'ACTIVE') throw new NotFoundException('Organization not found');
    return this.prisma.customer.upsert({
      where: { organizationId_email: { organizationId, email: user.email } },
      create: {
        organizationId,
        email: user.email,
        firstName: user.firstName,
        privacyAcceptedAt: new Date(),
      },
      update: {},
      select: { id: true, firstName: true, email: true, privacyAcceptedAt: true },
    });
  }

  async create(userId: string, organizationId: string, dto: CreatePromotionDto) {
    const access = await this.requireOrganizationPermission(userId, organizationId, 'promotions.create');
    await this.validateDto(dto);
    await this.validateCategory(dto.categoryId);
    const restaurants = await this.resolveRestaurants(organizationId, access.restaurantIds, dto.restaurantIds);
    const activeCount = await this.prisma.promotion.count({
      where: { organizationId, status: { in: ['ACTIVE', 'SCHEDULED'] }, archivedAt: null },
    });
    await this.planLimits.assertLimitNotReached(organizationId, 'maxActivePromotions', activeCount);
    await this.featureAccess.assertFeatureEnabled(organizationId, 'PROMOTIONS_BASIC');
    const status = dto.startsAt && new Date(dto.startsAt) > new Date()
      ? PromotionStatus.SCHEDULED
      : PromotionStatus.DRAFT;
    const { schedules, images, ...data } = dto;
    return this.prisma.promotion.create({
      data: {
        organizationId,
        createdById: userId,
        name: data.name.trim(),
        shortDescription: data.shortDescription,
        description: data.description,
        termsAndConditions: data.termsAndConditions,
        type: data.type,
        categoryId: data.categoryId,
        status,
        discountPercentage: data.discountPercentage,
        discountAmount: data.discountAmount,
        promotionalPrice: data.promotionalPrice,
        benefitDescription: data.benefitDescription,
        coverImageUrl: images?.[0]?.url ?? null,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        timezone: data.timezone ?? 'America/Bogota',
        isCombinable: data.allowCombination ?? false,
        restaurants: { create: restaurants.map((restaurantId) => ({ restaurantId })) },
        schedules: { create: (schedules ?? []).map((item) => ({ ...item })) },
        images: { create: (images ?? []).map((image, sortOrder) => ({ ...image, sortOrder })) },
        usageRule: {
          create: {
            maxGlobalRedemptions: data.maxGlobalRedemptions,
            maxRedemptionsPerCustomer: data.maxRedemptionsPerCustomer,
            frequency: (data.frequency as PromotionFrequency) ?? PromotionFrequency.UNLIMITED,
            intervalDays: data.intervalDays,
          },
        },
        auditLogs: {
          create: {
            organizationId,
            actorId: userId,
            action: 'CREATED',
            entityType: 'PROMOTION',
            newData: { name: data.name, status },
          },
        },
      },
      include: { usageRule: true, schedules: true, restaurants: true },
    });
  }

  async update(userId: string, organizationId: string, promotionId: string, dto: CreatePromotionDto) {
    await this.requireOrganizationPermission(userId, organizationId, 'promotions.update');
    await this.validateDto(dto);
    await this.validateCategory(dto.categoryId);
    const existing = await this.prisma.promotion.findFirst({
      where: { id: promotionId, organizationId },
      include: { _count: { select: { redemptions: true } } },
    });
    if (!existing) throw new NotFoundException('Promotion not found');
    if (existing._count.redemptions > 0 && dto.type !== existing.type) {
      throw new BadRequestException('A promotion with redemptions cannot change its benefit type');
    }
    const access = await this.requireOrganizationPermission(userId, organizationId, 'promotions.manage_locations');
    const restaurants = await this.resolveRestaurants(organizationId, access.restaurantIds, dto.restaurantIds);
    const { schedules, images, ...data } = dto;
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.promotion.update({
        where: { id: promotionId },
        data: {
          updatedById: userId,
          name: data.name.trim(),
          shortDescription: data.shortDescription,
          description: data.description,
          termsAndConditions: data.termsAndConditions,
          type: data.type,
          categoryId: data.categoryId,
          discountPercentage: data.discountPercentage,
          discountAmount: data.discountAmount,
          promotionalPrice: data.promotionalPrice,
          benefitDescription: data.benefitDescription,
          coverImageUrl: images?.[0]?.url ?? null,
          startsAt: data.startsAt ? new Date(data.startsAt) : null,
          endsAt: data.endsAt ? new Date(data.endsAt) : null,
          timezone: data.timezone ?? existing.timezone,
          isCombinable: data.allowCombination ?? existing.isCombinable,
          restaurants: {
            deleteMany: {},
            create: restaurants.map((restaurantId) => ({ restaurantId })),
          },
          schedules: {
            deleteMany: {},
            create: (schedules ?? []).map((item) => ({ ...item })),
          },
          images: {
            deleteMany: {},
            create: (images ?? []).map((image, sortOrder) => ({ ...image, sortOrder })),
          },
          usageRule: {
            upsert: {
              create: {
                maxGlobalRedemptions: data.maxGlobalRedemptions,
                maxRedemptionsPerCustomer: data.maxRedemptionsPerCustomer,
                frequency: (data.frequency as PromotionFrequency) ?? PromotionFrequency.UNLIMITED,
                intervalDays: data.intervalDays,
              },
              update: {
                maxGlobalRedemptions: data.maxGlobalRedemptions,
                maxRedemptionsPerCustomer: data.maxRedemptionsPerCustomer,
                frequency: (data.frequency as PromotionFrequency) ?? PromotionFrequency.UNLIMITED,
                intervalDays: data.intervalDays,
              },
            },
          },
        },
      });
      await tx.promotionAuditLog.create({
        data: {
          organizationId,
          promotionId,
          actorId: userId,
          action: 'UPDATED',
          entityType: 'PROMOTION',
          previousData: { name: existing.name, status: existing.status },
          newData: { name: updated.name, status: updated.status },
        },
      });
      return updated;
    });
  }

  async transition(userId: string, organizationId: string, promotionId: string, action: 'publish' | 'pause' | 'resume' | 'archive' | 'unarchive') {
    const permission = action === 'archive' || action === 'unarchive' ? 'promotions.archive'
      : action === 'pause' || action === 'resume' ? 'promotions.pause'
      : 'promotions.publish';
    await this.requireOrganizationPermission(userId, organizationId, permission);
    const promotion = await this.prisma.promotion.findFirst({ where: { id: promotionId, organizationId } });
    if (!promotion) throw new NotFoundException('Promotion not found');
    await this.featureAccess.assertFeatureEnabled(organizationId, 'PROMOTIONS_BASIC');
    const now = new Date();
    let status: PromotionStatus;
    if (action === 'publish') {
      if (promotion.status !== 'DRAFT' && promotion.status !== 'SCHEDULED') throw new ConflictException('Only drafts or scheduled promotions can be published');
      status = promotion.startsAt && promotion.startsAt > now ? PromotionStatus.SCHEDULED : PromotionStatus.ACTIVE;
      if (status === PromotionStatus.ACTIVE) {
        const count = await this.prisma.promotion.count({
          where: { organizationId, id: { not: promotionId }, status: { in: ['ACTIVE', 'SCHEDULED'] }, archivedAt: null },
        });
        await this.planLimits.assertLimitNotReached(organizationId, 'maxActivePromotions', count);
      }
    } else if (action === 'pause') {
      if (promotion.status !== 'ACTIVE') throw new ConflictException('Only active promotions can be paused');
      status = PromotionStatus.PAUSED;
    } else if (action === 'resume') {
      if (promotion.status !== 'PAUSED' || (promotion.endsAt && promotion.endsAt <= now)) throw new ConflictException('This promotion cannot be resumed');
      status = promotion.startsAt && promotion.startsAt > now ? PromotionStatus.SCHEDULED : PromotionStatus.ACTIVE;
    } else if (action === 'unarchive') {
      if (promotion.status !== 'ARCHIVED') throw new ConflictException('Only archived promotions can be restored');
      status = PromotionStatus.DRAFT;
    } else {
      if (promotion.status === 'ARCHIVED') throw new ConflictException('Promotion is already archived');
      status = PromotionStatus.ARCHIVED;
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.promotion.update({
        where: { id: promotionId },
        data: {
          status,
          publishedAt: action === 'publish' ? now : promotion.publishedAt,
          archivedAt: action === 'archive' ? now : action === 'unarchive' ? null : promotion.archivedAt,
          updatedById: userId,
        },
      });
      await tx.promotionAuditLog.create({
        data: { organizationId, promotionId, actorId: userId, action: action.toUpperCase(), entityType: 'PROMOTION' },
      });
      return updated;
    });
  }

  async createRedemptionIntent(userId: string, email: string, promotionId: string) {
    const promotion = await this.prisma.promotion.findFirst({
      where: { id: promotionId },
      include: { usageRule: true, restaurants: { select: { restaurantId: true } } },
    });
    if (!promotion) throw new NotFoundException('Promotion not found');
    await this.featureAccess.assertFeatureEnabled(promotion.organizationId, 'QR_REDEMPTIONS');
    const customer = await this.prisma.customer.findFirst({
      where: { organizationId: promotion.organizationId, email: email.toLowerCase(), status: 'ACTIVE' },
    });
    if (!customer) throw new NotFoundException('Customer profile not found for this organization');
    await this.assertPromotionAvailable(promotion, customer.id);
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 2 * 60_000);
    const intent = await this.prisma.redemptionIntent.create({
      data: {
        promotionId,
        customerId: customer.id,
        expiresAt,
        token: { create: { tokenHash: tokenHash(token), expiresAt } },
      },
      select: { id: true, expiresAt: true },
    });
    return { intentId: intent.id, token, expiresAt: intent.expiresAt };
  }

  async validateRedemption(userId: string, restaurantId: string, token: string) {
    await this.requireWorkspacePermission(userId, restaurantId, 'redemptions.validate');
    const intent = await this.findIntent(token);
    await this.featureAccess.assertFeatureEnabled(intent.promotion.organizationId, 'QR_REDEMPTIONS');
    await this.assertIntentEligible(intent, restaurantId);
    return {
      intentId: intent.id,
      customer: {
        firstName: intent.customer.firstName,
        lastName: intent.customer.lastName,
      },
      promotion: {
        id: intent.promotion.id,
        name: intent.promotion.name,
        description: intent.promotion.shortDescription ?? intent.promotion.description,
        benefitDescription: intent.promotion.benefitDescription,
        type: intent.promotion.type,
      },
      expiresAt: intent.expiresAt,
      status: 'VALID',
    };
  }

  async confirmRedemption(userId: string, restaurantId: string, token: string, idempotencyKey: string) {
    await this.requireWorkspacePermission(userId, restaurantId, 'redemptions.confirm');
    if (!idempotencyKey?.trim()) throw new BadRequestException('Idempotency key is required');
    const existing = await this.prisma.promotionRedemption.findUnique({ where: { idempotencyKey } });
    if (existing) return existing;
    const intent = await this.findIntent(token);
    await this.featureAccess.assertFeatureEnabled(intent.promotion.organizationId, 'QR_REDEMPTIONS');
    try {
      return await this.prisma.$transaction(async (tx) => {
        const lockedIntent = await tx.redemptionIntent.updateMany({
          where: { id: intent.id, status: { in: ['PENDING', 'VALIDATED'] }, expiresAt: { gt: new Date() } },
          data: { status: 'CONSUMED', consumedAt: new Date() },
        });
        if (lockedIntent.count !== 1) throw new ConflictException('Redemption token has expired or was already used');
        const lockedToken = await tx.redemptionToken.updateMany({
          where: { intentId: intent.id, tokenHash: tokenHash(token), consumedAt: null, expiresAt: { gt: new Date() } },
          data: { consumedAt: new Date() },
        });
        if (lockedToken.count !== 1) throw new ConflictException('Redemption token has expired or was already used');
        const currentPromotion = await tx.promotion.findFirst({
          where: { id: intent.promotionId, organizationId: intent.promotion.organizationId },
          include: { usageRule: true, restaurants: true, schedules: true },
        });
        if (!currentPromotion) throw new NotFoundException('Promotion not found');
        await this.assertPromotionAvailable(currentPromotion, intent.customerId, tx);
        await this.assertLocation(intent.promotionId, currentPromotion.organizationId, restaurantId, tx);
        await this.checkCustomerLimit(intent.promotionId, intent.customerId, currentPromotion.usageRule, tx, currentPromotion.timezone);
        const rule = currentPromotion.usageRule;
        if (rule?.maxGlobalRedemptions !== null && rule?.maxGlobalRedemptions !== undefined) {
          const increment = await tx.promotion.updateMany({
            where: { id: intent.promotionId, globalRedemptionsCount: { lt: rule.maxGlobalRedemptions } },
            data: { globalRedemptionsCount: { increment: 1 } },
          });
          if (increment.count !== 1) throw new ConflictException('Promotion is exhausted');
          if (currentPromotion.globalRedemptionsCount + 1 >= rule.maxGlobalRedemptions) {
            await tx.promotion.update({ where: { id: intent.promotionId }, data: { status: PromotionStatus.EXHAUSTED } });
          }
        } else {
          await tx.promotion.update({ where: { id: intent.promotionId }, data: { globalRedemptionsCount: { increment: 1 } } });
        }
        const redemption = await tx.promotionRedemption.create({
          data: {
            organizationId: intent.promotion.organizationId,
            promotionId: intent.promotionId,
            customerId: intent.customerId,
            restaurantId,
            employeeId: userId,
            intentId: intent.id,
            idempotencyKey,
          },
        });
        await tx.promotionAuditLog.create({
          data: {
            organizationId: intent.promotion.organizationId,
            promotionId: intent.promotionId,
            actorId: userId,
            action: 'REDEMPTION_CONFIRMED',
            entityType: 'REDEMPTION',
            entityId: redemption.id,
          },
        });
        return redemption;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const retry = await this.prisma.promotionRedemption.findUnique({ where: { idempotencyKey } });
        if (retry) return retry;
        throw new ConflictException('This redemption intent has already been consumed');
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictException('The promotion changed while confirming this redemption. Validate the token again.');
      }
      throw error;
    }
  }

  async listRedemptions(userId: string, restaurantId: string) {
    await this.requireWorkspacePermission(userId, restaurantId, 'redemptions.view');
    return this.prisma.promotionRedemption.findMany({
      where: { restaurantId },
      include: {
        promotion: { select: { id: true, name: true, type: true } },
        customer: { select: { id: true, firstName: true, lastName: true } },
        employee: { select: { id: true, firstName: true } },
      },
      orderBy: { redeemedAt: 'desc' },
      take: 100,
    });
  }

  async reverseRedemption(userId: string, restaurantId: string, redemptionId: string, reason: string) {
    await this.requireWorkspacePermission(userId, restaurantId, 'redemptions.reverse');
    if (!reason?.trim()) throw new BadRequestException('A reversal reason is required');
    return this.prisma.$transaction(async (tx) => {
      const redemption = await tx.promotionRedemption.findFirst({
        where: { id: redemptionId, restaurantId },
      });
      if (!redemption) throw new NotFoundException('Redemption not found');
      if (redemption.status === 'REVERSED') return redemption;
      const reversed = await tx.promotionRedemption.update({
        where: { id: redemption.id },
        data: { status: 'REVERSED', reversedAt: new Date(), reversedById: userId, reversalReason: reason.trim() },
      });
      await tx.promotion.update({
        where: { id: redemption.promotionId },
        data: { globalRedemptionsCount: { decrement: 1 } },
      });
      await tx.promotionAuditLog.create({
        data: {
          organizationId: redemption.organizationId,
          promotionId: redemption.promotionId,
          actorId: userId,
          action: 'REDEMPTION_REVERSED',
          entityType: 'REDEMPTION',
          entityId: redemption.id,
          previousData: { status: redemption.status },
          newData: { status: 'REVERSED', reason: reason.trim() },
        },
      });
      const promotion = await tx.promotion.findUnique({ where: { id: redemption.promotionId } });
      if (promotion?.status === 'EXHAUSTED') {
        const status = promotion.endsAt && promotion.endsAt <= new Date() ? 'EXPIRED' : 'ACTIVE';
        await tx.promotion.update({ where: { id: redemption.promotionId }, data: { status } });
      }
      return reversed;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  private async assertPromotionAvailable(promotion: any, customerId: string, tx: Prisma.TransactionClient = this.prisma) {
    const now = new Date();
    if (promotion.status !== 'ACTIVE' || (promotion.startsAt && promotion.startsAt > now) || (promotion.endsAt && promotion.endsAt <= now)) {
      throw new ConflictException('Promotion is not currently available');
    }
    if (promotion.usageRule?.maxGlobalRedemptions !== null && promotion.usageRule?.maxGlobalRedemptions !== undefined && promotion.globalRedemptionsCount >= promotion.usageRule.maxGlobalRedemptions) {
      throw new ConflictException('Promotion is exhausted');
    }
    if (promotion.restaurants?.length === 0) throw new ConflictException('Promotion has no participating locations');
    if (promotion.usageRule) await this.checkCustomerLimit(promotion.id, customerId, promotion.usageRule, tx, promotion.timezone);
    await this.assertSchedule(promotion, now);
  }

  private async checkCustomerLimit(promotionId: string, customerId: string, rule: any, tx: Prisma.TransactionClient = this.prisma, timezone = 'America/Bogota') {
    if (!rule) return;
    const where: Prisma.PromotionRedemptionWhereInput = { promotionId, customerId, status: 'CONFIRMED' };
    const count = await tx.promotionRedemption.count({ where });
    if (rule.maxRedemptionsPerCustomer !== null && count >= rule.maxRedemptionsPerCustomer) throw new ConflictException('Customer redemption limit reached');
    if (rule.frequency === 'ONCE' && count > 0) throw new ConflictException('Promotion can only be redeemed once');
    let after: Date | undefined;
    const now = new Date();
    const dateParts = this.zonedDateParts(now, timezone);
    if (rule.frequency === 'DAILY') after = this.zonedStartOfDay(dateParts.year, dateParts.month, dateParts.day, timezone);
    if (rule.frequency === 'EVERY_N_DAYS') after = new Date(now.getTime() - (rule.intervalDays ?? 1) * 86_400_000);
    if (rule.frequency === 'CALENDAR_MONTH') after = this.zonedStartOfDay(dateParts.year, dateParts.month, 1, timezone);
    if (rule.frequency === 'WEEKLY') {
      const weekday = new Date(Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day)).getUTCDay();
      const daysSinceMonday = (weekday + 6) % 7;
      const monday = new Date(Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day - daysSinceMonday));
      after = this.zonedStartOfDay(monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate(), timezone);
    }
    if (after && await tx.promotionRedemption.count({ where: { ...where, redeemedAt: { gte: after } } })) throw new ConflictException('Customer redemption frequency limit reached');
  }

  private zonedDateParts(date: Date, timezone: string) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    return {
      year: Number(parts.find((part) => part.type === 'year')?.value),
      month: Number(parts.find((part) => part.type === 'month')?.value),
      day: Number(parts.find((part) => part.type === 'day')?.value),
    };
  }

  private zonedStartOfDay(year: number, month: number, day: number, timezone: string) {
    const targetUtc = Date.UTC(year, month - 1, day);
    let candidate = targetUtc;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const actual = this.zonedDateParts(new Date(candidate), timezone);
      const representedUtc = Date.UTC(actual.year, actual.month - 1, actual.day);
      candidate -= representedUtc - targetUtc;
      const clock = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(new Date(candidate));
      const seconds = Number(clock.find((part) => part.type === 'hour')?.value) * 3600 +
        Number(clock.find((part) => part.type === 'minute')?.value) * 60 +
        Number(clock.find((part) => part.type === 'second')?.value);
      candidate -= seconds * 1000;
    }
    return new Date(candidate);
  }

  private async assertSchedule(promotion: any, now: Date) {
    const schedules = promotion.schedules ?? await this.prisma.promotionSchedule.findMany({ where: { promotionId: promotion.id, isActive: true } });
    if (!schedules.length) return;
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: promotion.timezone ?? 'America/Bogota',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.find((part) => part.type === 'weekday')?.value ?? 'Mon');
    const minute = Number(parts.find((part) => part.type === 'hour')?.value ?? 0) * 60 + Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
    const valid = schedules.some((item: any) => item.isActive && item.dayOfWeek === (weekday === 0 ? 7 : weekday) &&
      minute >= this.minuteOfDay(item.startsAt) && minute < this.minuteOfDay(item.endsAt));
    if (!valid) throw new ConflictException('Promotion is outside its availability schedule');
  }

  private minuteOfDay(value: string) {
    const [hour, minute] = value.split(':').map(Number);
    return hour * 60 + minute;
  }

  private async findIntent(token: string) {
    const intent = await this.prisma.redemptionIntent.findFirst({
      where: { token: { tokenHash: tokenHash(token) } },
      include: {
        customer: true,
        token: true,
        promotion: { include: { usageRule: true, restaurants: true, schedules: true } },
      },
    });
    if (!intent || !intent.token || intent.token.expiresAt <= new Date() || intent.token.consumedAt || intent.expiresAt <= new Date() || !['PENDING', 'VALIDATED'].includes(intent.status)) {
      throw new ConflictException('Redemption token is invalid, expired or already used');
    }
    return intent;
  }

  private async assertIntentEligible(intent: any, restaurantId: string) {
    await this.assertPromotionAvailable(intent.promotion, intent.customerId);
    await this.assertLocation(intent.promotionId, intent.promotion.organizationId, restaurantId);
    await this.checkCustomerLimit(intent.promotionId, intent.customerId, intent.promotion.usageRule, this.prisma, intent.promotion.timezone);
    await this.prisma.redemptionIntent.update({ where: { id: intent.id }, data: { status: 'VALIDATED', validatedAt: new Date() } });
  }

  private async assertLocation(promotionId: string, organizationId: string, restaurantId: string, tx: Prisma.TransactionClient = this.prisma) {
    const restaurant = await tx.restaurant.findFirst({
      where: { id: restaurantId, organizationId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!restaurant) throw new ForbiddenException('Restaurant is not active or does not belong to this promotion organization');
    const relation = await tx.promotionRestaurant.findUnique({ where: { promotionId_restaurantId: { promotionId, restaurantId } } });
    if (!relation) throw new ForbiddenException('Promotion is not available at this location');
  }

  private async requireOrganizationPermission(userId: string, organizationId: string, permission: string) {
    const access = await this.authorization.getOrganizationAccess(userId, organizationId);
    if (!access.permissions.includes(permission)) throw new ForbiddenException('You do not have permission to manage this promotion');
    return access;
  }

  private async requireWorkspacePermission(userId: string, restaurantId: string, permission: string) {
    const access = await this.authorization.getWorkspaceAccess(userId, restaurantId);
    if (!access.permissions.includes(permission)) throw new ForbiddenException('You do not have permission to redeem promotions');
    return access;
  }

  private async resolveRestaurants(organizationId: string, authorizedIds: string[], selected?: string[]) {
    const ids = selected?.length ? [...new Set(selected)] : authorizedIds;
    if (!ids.length) throw new BadRequestException('Select at least one participating location');
    const found = await this.prisma.restaurant.findMany({ where: { id: { in: ids }, organizationId, status: 'ACTIVE' }, select: { id: true } });
    if (found.length !== ids.length || ids.some((id) => !authorizedIds.includes(id))) throw new ForbiddenException('Every location must belong to this organization and be within your access');
    return ids;
  }

  private async validateDto(dto: CreatePromotionDto) {
    if (dto.startsAt && dto.endsAt && new Date(dto.startsAt) >= new Date(dto.endsAt)) throw new BadRequestException('End date must be after start date');
    if (dto.frequency === 'EVERY_N_DAYS' && !dto.intervalDays) throw new BadRequestException('intervalDays is required for EVERY_N_DAYS');
    if (dto.type === PromotionType.PERCENTAGE_DISCOUNT && dto.discountPercentage == null) throw new BadRequestException('discountPercentage is required');
    if (dto.type === PromotionType.FIXED_DISCOUNT && dto.discountAmount == null) throw new BadRequestException('discountAmount is required');
    if (dto.type === PromotionType.SPECIAL_PRICE && dto.promotionalPrice == null) throw new BadRequestException('promotionalPrice is required');
    if (
      ([PromotionType.TWO_FOR_ONE, PromotionType.FREE_PRODUCT, PromotionType.SPECIAL_COMBO, PromotionType.EXCLUSIVE_BENEFIT] as PromotionType[]).includes(dto.type) &&
      !dto.benefitDescription?.trim()
    ) throw new BadRequestException('benefitDescription is required for this promotion type');
    for (const schedule of dto.schedules ?? []) {
      if (!Number.isInteger(schedule.dayOfWeek) || schedule.dayOfWeek < 1 || schedule.dayOfWeek > 7 ||
          !/^([01]\d|2[0-3]):[0-5]\d$/.test(schedule.startsAt) ||
          !/^([01]\d|2[0-3]):[0-5]\d$/.test(schedule.endsAt) ||
          schedule.startsAt >= schedule.endsAt) throw new BadRequestException('Invalid promotion schedule');
    }
    if (dto.timezone) {
      try { new Intl.DateTimeFormat('en-US', { timeZone: dto.timezone }); }
      catch { throw new BadRequestException('Invalid timezone'); }
    }
  }

  private async validateCategory(categoryId?: string) {
    if (!categoryId) return;
    const category = await this.prisma.promotionCategory.findFirst({
      where: { id: categoryId, isActive: true },
      select: { id: true },
    });
    if (!category) throw new BadRequestException('Promotion category is invalid or inactive');
  }
}
