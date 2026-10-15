import {

    Body,

    Controller,

    Get,

    Headers,

    HttpCode,

    HttpStatus,

    Post,

    Req,

    Res,

    UnauthorizedException,

    UseGuards,

    Version,

} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import type { Response } from 'express';

import type { Request } from 'express';

import { JwtAuthGuard } from '../../../auth/guards/jwt-auth/jwt-auth.guard.js';

import { PaymentsService } from '../../services/payments/payments.service.js';

import { PaymentAuthorizationService } from '../../services/payment-authorization/payment-authorization.service.js';

import { CreatePaymentMethodDto } from '../../dto/create-payment-method.dto.js';

import { ProcessWompiTokenDto } from '../../dto/process-wompi-token.dto/process-wompi-token.dto.js';

import { CreatePaymentTransactionDto } from '../../dto/create-payment-transaction.dto/create-payment-transaction.dto.js';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}

@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly paymentsService: PaymentsService,
        private readonly paymentAuthorizationService: PaymentAuthorizationService,
        private readonly configService: ConfigService,
    ) { }

    // ==========================================
    // WOMPI MERCHANT INFO
    // ==========================================

    @Get('wompi/merchant-info')
    @Version('1')
    @UseGuards(JwtAuthGuard)
    async getMerchantInfo() {
        return this.paymentsService.getMerchantInfo();
    }

    // ==========================================
    // WOMPI ACCEPTANCE TOKENS
    // ==========================================

    @Get('wompi/acceptance-tokens')
    @Version('1')
    @UseGuards(JwtAuthGuard)
    async getAcceptanceTokens() {
        return this.paymentsService.getAcceptanceTokens();
    }

    // ==========================================
    // AUTHORIZE SUBSCRIPTION PAYMENT
    // ==========================================

    @Post('wompi/authorization')
    @Version('1')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async authorizePayment(
        @Req() request: AuthenticatedRequest,
        @Body('subscriptionId') subscriptionId: string,
    ) {
        const user = request.user;

        if (!user?.userId) {
            throw new UnauthorizedException(
                'User is not authenticated',
            );
        }

        if (
            typeof subscriptionId !== 'string' ||
            subscriptionId.trim().length === 0
        ) {
            throw new UnauthorizedException(
                'A valid subscriptionId is required',
            );
        }

        return this.paymentAuthorizationService.authorizePayment(
            user.userId,
            subscriptionId,
        );
    }

    // ==========================================
    // CREATE PAYMENT METHOD
    // ==========================================

    @Post('payment-method')
    @Version('1')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async createPaymentMethod(
        @Req() request: AuthenticatedRequest,
        @Body() dto: CreatePaymentMethodDto,
        @Headers('x-payment-authorization')
        authorizationToken: string,
    ) {
        const user = request.user;

        if (!user?.userId) {
            throw new UnauthorizedException(
                'User is not authenticated',
            );
        }

        if (
            typeof authorizationToken !== 'string' ||
            authorizationToken.trim().length === 0
        ) {
            throw new UnauthorizedException(
                'Payment authorization is required',
            );
        }

        return this.paymentsService.createPaymentMethod(
            dto,
            user.userId,
            authorizationToken,
        );
    }

    // ==========================================
    // PROCESS WOMPI WIDGET TOKEN
    // ==========================================

    @Post('wompi/token')
    @Version('1')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async processWompiToken(
        @Req() request: AuthenticatedRequest,
        @Body() dto: ProcessWompiTokenDto,
        @Res() response: Response,
    ) {
        const user = request.user;

        if (!user?.userId) {
            throw new UnauthorizedException(
                'User is not authenticated',
            );
        }

        const result = await this.paymentsService.processWompiToken(
            dto,
            user.userId,
        );

        const frontendUrl = this.configService
            .get<string>('FRONTEND_URL');

        if (!frontendUrl) {
            return response.status(HttpStatus.OK).json(result);
        }

        const redirectUrl = new URL(
            '/auth/subscription',
            frontendUrl,
        );

        redirectUrl.searchParams.set('payment', 'processing');
        redirectUrl.searchParams.set(
            'subscriptionId',
            dto.subscriptionId,
        );

        return response.redirect(
            HttpStatus.SEE_OTHER,
            redirectUrl.toString(),
        );
    }



    // ==========================================
    // CREATE TRANSACTION
    // ==========================================

    @Post('transaction')
    @Version('1')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async createTransaction(
        @Req() request: AuthenticatedRequest,
        @Body() dto: CreatePaymentTransactionDto,
        @Headers('x-payment-authorization')
        authorizationToken: string,
    ) {
        const user = request.user;

        if (!user?.userId) {
            throw new UnauthorizedException(
                'User is not authenticated',
            );
        }

        if (
            typeof authorizationToken !== 'string' ||
            authorizationToken.trim().length === 0
        ) {
            throw new UnauthorizedException(
                'Payment authorization is required',
            );
        }

        return this.paymentsService.createTransaction(
            dto,
            user.userId,
            authorizationToken,
        );
    }
}