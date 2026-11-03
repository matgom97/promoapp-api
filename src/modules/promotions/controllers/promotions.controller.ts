import {
  Body,
  BadRequestException,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth/jwt-auth.guard.js';
import { WorkspaceContextGuard } from '../../../common/authorization/guards/workspace-context.guard.js';
import {
  ConfirmRedemptionDto,
  CreatePromotionDto,
  CreateRedemptionIntentDto,
  RedemptionTokenDto,
  RegisterCustomerProfileDto,
  ReverseRedemptionDto,
} from '../dto/create-promotion.dto.js';
import { PromotionsService } from '../services/promotions.service.js';

interface AuthRequest extends Request {
  user?: { userId: string; email: string };
}

@Controller({ path: 'promotions', version: '1' })
@UseGuards(JwtAuthGuard)
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get('organizations/:organizationId')
  async list(@Req() req: AuthRequest, @Param('organizationId') organizationId: string) {
    const user = this.user(req);
    return { message: 'Promotions retrieved', data: await this.promotions.list(user.userId, organizationId) };
  }

  @Post('organizations/:organizationId')
  async create(@Req() req: AuthRequest, @Param('organizationId') organizationId: string, @Body() dto: CreatePromotionDto) {
    const user = this.user(req);
    return { message: 'Promotion created', data: await this.promotions.create(user.userId, organizationId, dto) };
  }

  @Get('organizations/:organizationId/:promotionId')
  async get(@Req() req: AuthRequest, @Param('organizationId') organizationId: string, @Param('promotionId') promotionId: string) {
    const user = this.user(req);
    return { message: 'Promotion retrieved', data: await this.promotions.get(user.userId, organizationId, promotionId) };
  }

  @Patch('organizations/:organizationId/:promotionId')
  async update(@Req() req: AuthRequest, @Param('organizationId') organizationId: string, @Param('promotionId') promotionId: string, @Body() dto: CreatePromotionDto) {
    const user = this.user(req);
    return { message: 'Promotion updated', data: await this.promotions.update(user.userId, organizationId, promotionId, dto) };
  }

  @Post('organizations/:organizationId/:promotionId/:action')
  async transition(@Req() req: AuthRequest, @Param('organizationId') organizationId: string, @Param('promotionId') promotionId: string, @Param('action') action: 'publish' | 'pause' | 'resume' | 'archive' | 'unarchive') {
    if (!['publish', 'pause', 'resume', 'archive', 'unarchive'].includes(action)) throw new BadRequestException('Unknown promotion action');
    const user = this.user(req);
    return { message: 'Promotion status updated', data: await this.promotions.transition(user.userId, organizationId, promotionId, action) };
  }

  @Post('redemption-intents')
  async createIntent(@Req() req: AuthRequest, @Body() dto: CreateRedemptionIntentDto) {
    const user = this.user(req);
    return { message: 'Redemption QR generated', data: await this.promotions.createRedemptionIntent(user.userId, user.email, dto.promotionId) };
  }

  @Get('organizations/:organizationId/offers/available')
  async offers(@Param('organizationId') organizationId: string) {
    return { message: 'Available offers retrieved', data: await this.promotions.listOffers(organizationId) };
  }

  @Post('organizations/:organizationId/customer-profile')
  async registerCustomerProfile(@Req() req: AuthRequest, @Param('organizationId') organizationId: string, @Body() dto: RegisterCustomerProfileDto) {
    const user = this.user(req);
    return {
      message: 'Customer profile available',
      data: await this.promotions.registerCustomerProfile(user.userId, organizationId, dto.acceptPrivacy),
    };
  }

  @Post('redemptions/validate')
  @UseGuards(WorkspaceContextGuard)
  async validateRedemption(@Req() req: AuthRequest, @Body() dto: RedemptionTokenDto) {
    const user = this.user(req);
    const restaurantId = req.header('X-Restaurant-Id');
    if (!restaurantId) throw new UnauthorizedException('Select a restaurant');
    return { message: 'Redemption validated', data: await this.promotions.validateRedemption(user.userId, restaurantId, dto.token) };
  }

  @Post('redemptions/confirm')
  @UseGuards(WorkspaceContextGuard)
  async confirmRedemption(@Req() req: AuthRequest, @Body() body: ConfirmRedemptionDto) {
    const user = this.user(req);
    const restaurantId = req.header('X-Restaurant-Id');
    if (!restaurantId) throw new UnauthorizedException('Select a restaurant');
    return { message: 'Redemption confirmed', data: await this.promotions.confirmRedemption(user.userId, restaurantId, body.token, body.idempotencyKey) };
  }

  @Get('redemptions/history')
  @UseGuards(WorkspaceContextGuard)
  async redemptionsHistory(@Req() req: AuthRequest) {
    const user = this.user(req);
    const restaurantId = req.header('X-Restaurant-Id');
    if (!restaurantId) throw new UnauthorizedException('Select a restaurant');
    return { message: 'Redemptions retrieved', data: await this.promotions.listRedemptions(user.userId, restaurantId) };
  }

  @Post('redemptions/:redemptionId/reverse')
  @UseGuards(WorkspaceContextGuard)
  async reverseRedemption(@Req() req: AuthRequest, @Param('redemptionId') redemptionId: string, @Body() body: ReverseRedemptionDto) {
    const user = this.user(req);
    const restaurantId = req.header('X-Restaurant-Id');
    if (!restaurantId) throw new UnauthorizedException('Select a restaurant');
    return { message: 'Redemption reversed', data: await this.promotions.reverseRedemption(user.userId, restaurantId, redemptionId, body.reason) };
  }

  private user(request: AuthRequest) {
    if (!request.user?.userId || !request.user.email) throw new UnauthorizedException('User is not authenticated');
    return request.user;
  }
}
