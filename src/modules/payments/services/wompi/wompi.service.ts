import { Injectable } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { createHash } from 'node:crypto';


@Injectable()
export class WompiService {

  private readonly apiUrl: string;

  private readonly publicKey: string;

  private readonly privateKey: string;

  private readonly integritySecret: string;


  constructor(
    private readonly configService: ConfigService,
  ) {

    this.apiUrl =
      this.configService.getOrThrow<string>(
        'WOMPI_API_URL',
      );

    this.publicKey =
      this.configService.getOrThrow<string>(
        'WOMPI_PUBLIC_KEY',
      );

    this.privateKey =
      this.configService.getOrThrow<string>(
        'WOMPI_PRIVATE_KEY',
      );

    this.integritySecret =
      this.configService.getOrThrow<string>(
        'WOMPI_INTEGRITY_SECRET',
      );

  }


  // ==========================================
  // MERCHANT INFO
  // ==========================================

  async getMerchantInfo() {

    const response =
      await fetch(
        `${this.apiUrl}/merchants/info`,
        {
          method: 'GET',

          headers: {
            'x-merchant-public-key':
              this.publicKey,
          },
        },
      );


    if (!response.ok) {

      const errorBody =
        await response.text();

      throw new Error(
        `Wompi merchant info request failed: ${response.status} - ${errorBody}`,
      );

    }


    return response.json();

  }


  // ==========================================
  // ACCEPTANCE TOKENS
  // ==========================================

  async getAcceptanceTokens() {

    const response =
      await fetch(
        `${this.apiUrl}/merchants/info`,
        {
          method: 'GET',

          headers: {
            'x-merchant-public-key':
              this.publicKey,
          },
        },
      );


    if (!response.ok) {

      const errorBody =
        await response.text();

      throw new Error(
        `Wompi acceptance tokens request failed: ${response.status} - ${errorBody}`,
      );

    }


    const result =
      await response.json();


    const acceptance =
      result?.data?.presigned_acceptance;

    const personalDataAuth =
      result?.data?.presigned_personal_data_auth;


    if (
      !acceptance?.acceptance_token ||
      !personalDataAuth?.acceptance_token
    ) {

      throw new Error(
        'Wompi acceptance tokens were not returned',
      );

    }


    return {

      acceptanceToken:
        acceptance.acceptance_token,

      acceptancePermalink:
        acceptance.permalink,

      personalDataAuthToken:
        personalDataAuth.acceptance_token,

      personalDataAuthPermalink:
        personalDataAuth.permalink,

    };

  }


  // ==========================================
  // CREATE PAYMENT SOURCE
  // ==========================================

  async createPaymentSource(data: {

    token: string;

    sessionId: string;

    customerEmail: string;

    acceptanceToken: string;

    personalDataAuthToken: string;

  }) {

    const response =
      await fetch(
        `${this.apiUrl}/payment_sources`,
        {
          method: 'POST',

          headers: {

            Authorization:
              `Bearer ${this.privateKey}`,

            'Content-Type':
              'application/json',

          },

          body: JSON.stringify({

            type: 'CARD',

            token:
              data.token,

            customer_email:
              data.customerEmail,

            acceptance_token:
              data.acceptanceToken,

            accept_personal_auth:
              data.personalDataAuthToken,

            session_id:
              data.sessionId,

          }),

        },
      );


    if (!response.ok) {

      const errorBody =
        await response.text();

      throw new Error(
        `Wompi payment source request failed: ${response.status} - ${errorBody}`,
      );

    }


    return response.json();

  }


  // ==========================================
  // INTEGRITY SIGNATURE
  // ==========================================

  private generateIntegritySignature(
    reference: string,

    amountInCents: bigint,

    currency: string,
  ): string {

    const payload =
      `${reference}${amountInCents.toString()}${currency}${this.integritySecret}`;


    return createHash('sha256')
      .update(payload)
      .digest('hex');

  }


  // ==========================================
  // CREATE TRANSACTION
  // ==========================================

  async createTransaction(data: {

    amountInCents: bigint;

    currency: string;

    reference: string;

    customerEmail: string;

    paymentSourceId: string;

    installments: number;

    sessionId: string;

    acceptanceToken: string;

  }) {

    const signature =
      this.generateIntegritySignature(
        data.reference,

        data.amountInCents,

        data.currency,
      );


    const response =
      await fetch(
        `${this.apiUrl}/transactions`,
        {
          method: 'POST',

          headers: {

            Authorization:
              `Bearer ${this.privateKey}`,

            'Content-Type':
              'application/json',

          },

          body: JSON.stringify({

            amount_in_cents:
              Number(
                data.amountInCents,
              ),

            currency:
              data.currency,

            public_key:
              this.publicKey,

            customer_email:
              data.customerEmail,

            reference:
              data.reference,

            payment_source_id:
              data.paymentSourceId,

            payment_method: {

              type:
                'CARD',

              installments:
                data.installments,

            },

            signature,

            acceptance_token:
              data.acceptanceToken,

            session_id:
              data.sessionId,

          }),

        },
      );


    if (!response.ok) {

      const errorBody =
        await response.text();

      throw new Error(
        `Wompi transaction request failed: ${response.status} - ${errorBody}`,
      );

    }


    return response.json();

  }

}