import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Headers,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Req,
    Res,
    UnauthorizedException,
    UseGuards,
    Version,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import type { Response, Request } from 'express';

import { JwtAuthGuard } from '../../../auth/guards/jwt-auth/jwt-auth.guard.js';

import { PaymentsService } from '../../services/payments/payments.service.js';

import { PaymentAuthorizationService } from '../../services/payment-authorization/payment-authorization.service.js';

import { CreatePaymentMethodDto } from '../../dto/create-payment-method.dto.js';

import { ProcessWompiTokenDto } from '../../dto/process-wompi-token.dto/process-wompi-token.dto.js';

import { CreatePaymentTransactionDto } from '../../dto/create-payment-transaction.dto/create-payment-transaction.dto.js';

import { AuthorizePaymentDto } from '../../dto/authorize-payment/authorize-payment.dto.js';


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

    /**
     * Información del comercio en Wompi.
     */
    @Get('wompi/merchant-info')
    @Version('1')
    @UseGuards(JwtAuthGuard)
    async getMerchantInfo() {
        return this.paymentsService.getMerchantInfo();
    }

    /**
     * Tokens de aceptación de Wompi.
     */
    @Get('wompi/acceptance-tokens')
    @Version('1')
    @UseGuards(JwtAuthGuard)
    async getAcceptanceTokens() {
        return this.paymentsService.getAcceptanceTokens();
    }

    /**
     * Autoriza al propietario a iniciar el proceso de pago.
     */
    @Post('wompi/authorization')
    @Version('1')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async authorizePayment(
        @Req() request: AuthenticatedRequest,
        @Body() dto: AuthorizePaymentDto,
    ) {
        const user = request.user;

        if (!user?.userId) {
            throw new UnauthorizedException(
                'User is not authenticated',
            );
        }

        return this.paymentAuthorizationService.authorizePayment(
            user.userId,
            dto.subscriptionId,
        );
    }

    /**
     * Registra una fuente de pago.
     */
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
            !authorizationToken.trim()
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

    /**
     * Procesa el token generado por el widget de Wompi.
     *
     * Responde con JSON para que Angular controle la navegación
     * y pueda mostrar el estado real del pago.
     */
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

        const frontendUrl =
            this.configService.getOrThrow<string>('FRONTEND_URL');

        const redirectUrl = new URL(
            '/auth/subscription',
            frontendUrl,
        );

        redirectUrl.searchParams.set('payment', 'processing');
        redirectUrl.searchParams.set(
            'subscriptionId',
            dto.subscriptionId,
        );

        return response.redirect(303, redirectUrl.toString());
    }

    /**
     * Crea una transacción usando un método de pago registrado.
     */
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
            !authorizationToken.trim()
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

    /**
     * Consulta el pago más reciente de una suscripción.
     *
     * Permite recuperar el estado después de cerrar el navegador
     * o regresar al checkout.
     */
    @Get('subscription/:subscriptionId/latest')
    @Version('1')
    @UseGuards(JwtAuthGuard)
    async getLatestSubscriptionPayment(
        @Req() request: AuthenticatedRequest,
        @Param('subscriptionId') subscriptionId: string,
    ) {
        const user = request.user;

        if (!user?.userId) {
            throw new UnauthorizedException(
                'User is not authenticated',
            );
        }

        if (!subscriptionId?.trim()) {
            throw new BadRequestException(
                'A valid subscriptionId is required',
            );
        }

        return this.paymentsService.getLatestSubscriptionPayment(
            subscriptionId,
            user.userId,
        );
    }
}