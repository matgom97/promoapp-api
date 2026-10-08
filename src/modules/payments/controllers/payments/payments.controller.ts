import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  Version,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import type { Response } from 'express';

import { PaymentsService } from '../../services/payments/payments.service.js';

import { WompiService } from '../../services/wompi/wompi.service.js';

import { CreatePaymentMethodDto } from '../../dto/create-payment-method.dto.js';

import { CreatePaymentTransactionDto } from '../../dto/create-payment-transaction.dto/create-payment-transaction.dto.js';

import { ProcessWompiTokenDto } from '../../dto/process-wompi-token.dto/process-wompi-token.dto.js';


@Controller('payments')
export class PaymentsController {

  private readonly frontendUrl: string;

  constructor(
    private readonly paymentsService:
      PaymentsService,

    private readonly wompiService:
      WompiService,

    private readonly configService:
      ConfigService,
  ) {

    this.frontendUrl =
      this.configService.getOrThrow<string>(
        'FRONTEND_URL',
      );

  }


  // ==========================================
  // WOMPI MERCHANT INFO
  // ==========================================

  @Get('wompi/merchant-info')
  @Version('1')
  async getWompiMerchantInfo() {

    return this.wompiService
      .getMerchantInfo();

  }


  // ==========================================
  // ACCEPTANCE TOKENS
  // ==========================================

  @Get('wompi/acceptance-tokens')
  @Version('1')
  async getAcceptanceTokens() {

    return {
      data:
        await this.wompiService
          .getAcceptanceTokens(),
    };

  }


  // ==========================================
  // PAYMENT METHOD
  // ==========================================

  @Post('payment-method')
  @Version('1')
  async createPaymentMethod(
    @Body()
    dto: CreatePaymentMethodDto,
  ) {

    return this.paymentsService
      .createPaymentMethod(dto);

  }


  // ==========================================
  // WOMPI TOKEN
  // ==========================================
  //
  // Este endpoint es llamado por el Widget
  // de Wompi mediante POST.
  //
  // El resultado NO se devuelve como JSON
  // al navegador.
  //
  // Una vez creada la transacción:
  //
  // Backend
  //    ↓
  // HTTP 303
  //    ↓
  // Angular
  //
  // Angular será responsable de consultar
  // posteriormente el estado real.
  //
  // ==========================================

  @Post('wompi/token')
  @Version('1')
  async processWompiToken(
    @Body()
    dto: ProcessWompiTokenDto,

    @Res()
    response: Response,
  ) {

    await this.paymentsService
      .processWompiToken(dto);


    /*
     * Regresamos al frontend.
     *
     * El pago todavía puede estar PENDING.
     *
     * El webhook de Wompi será quien determine
     * posteriormente si fue APPROVED, DECLINED,
     * VOIDED o ERROR.
     */

    const redirectUrl =
      new URL(
        '/auth/subscription',
        this.frontendUrl,
      );


    /*
     * Indicamos que Angular acaba de regresar
     * de un intento de pago.
     */

    redirectUrl.searchParams.set(
      'payment',
      'processing',
    );


    /*
     * Angular necesita saber qué suscripción
     * debe consultar.
     */

    redirectUrl.searchParams.set(
      'subscriptionId',
      dto.subscriptionId,
    );


    /*
     * 303 See Other:
     *
     * El POST termina aquí y el navegador
     * realiza un GET hacia Angular.
     */

    return response.redirect(
      303,
      redirectUrl.toString(),
    );

  }


  // ==========================================
  // TRANSACTION
  // ==========================================

  @Post('transaction')
  @Version('1')
  async createTransaction(
    @Body()
    dto: CreatePaymentTransactionDto,
  ) {

    return this.paymentsService
      .createTransaction(dto);

  }

}