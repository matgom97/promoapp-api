import {
    Injectable,
    InternalServerErrorException,
    ServiceUnavailableException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';

export interface WompiTransactionData {
    id: string;
    status: string;
    reference: string;
    amount_in_cents: number;
    currency: string;
}

export interface WompiTransactionResponse {
    data: WompiTransactionData;
}

interface WompiMerchantResponse {
    data?: {
        presigned_acceptance?: {
            acceptance_token?: string;
            permalink?: string;
        };
        presigned_personal_data_auth?: {
            acceptance_token?: string;
            permalink?: string;
        };
    };
}

interface WompiPaymentSourceResponse {
    data?: {
        id?: string | number;
        public_data?: {
            brand?: string;
            last_four?: string;
        };
        brand?: string;
        last_four?: string;
    };
}

@Injectable()
export class WompiService {
    private readonly apiUrl: string;
    private readonly publicKey: string;
    private readonly privateKey: string;
    private readonly integritySecret: string;

    constructor(
        private readonly configService: ConfigService,
    ) {
        this.apiUrl = this.configService
            .getOrThrow<string>('WOMPI_API_URL')
            .replace(/\/+$/, '');

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

    /**
     * Consulta la información del comercio.
     */
    async getMerchantInfo() {
        return this.requestJson<unknown>(
            `${this.apiUrl}/merchants/info`,
            {
                method: 'GET',
                headers: {
                    'x-merchant-public-key': this.publicKey,
                    Accept: 'application/json',
                },
            },
            'merchant information',
        );
    }

    /**
     * Obtiene los tokens de aceptación requeridos por Wompi.
     */
    async getAcceptanceTokens() {
        const result =
            await this.requestJson<WompiMerchantResponse>(
                `${this.apiUrl}/merchants/info`,
                {
                    method: 'GET',
                    headers: {
                        'x-merchant-public-key': this.publicKey,
                        Accept: 'application/json',
                    },
                },
                'acceptance tokens',
            );

        const acceptance =
            result.data?.presigned_acceptance;

        const personalDataAuth =
            result.data?.presigned_personal_data_auth;

        if (
            !acceptance?.acceptance_token ||
            !personalDataAuth?.acceptance_token
        ) {
            throw new ServiceUnavailableException(
                'Wompi no devolvió los tokens de aceptación requeridos.',
            );
        }

        return {
            acceptanceToken: acceptance.acceptance_token,
            acceptancePermalink: acceptance.permalink,
            personalDataAuthToken:
                personalDataAuth.acceptance_token,
            personalDataAuthPermalink:
                personalDataAuth.permalink,
        };
    }

    /**
     * Crea una fuente de pago tokenizada.
     */
    async createPaymentSource(data: {
        token: string;
        sessionId: string;
        customerEmail: string;
        acceptanceToken: string;
        personalDataAuthToken: string;
    }): Promise<WompiPaymentSourceResponse> {
        if (
            !data.token?.trim() ||
            !data.sessionId?.trim() ||
            !data.customerEmail?.trim() ||
            !data.acceptanceToken?.trim() ||
            !data.personalDataAuthToken?.trim()
        ) {
            throw new InternalServerErrorException(
                'Faltan datos requeridos para crear la fuente de pago.',
            );
        }

        return this.requestJson<WompiPaymentSourceResponse>(
            `${this.apiUrl}/payment_sources`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.privateKey}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    type: 'CARD',
                    token: data.token,
                    customer_email: data.customerEmail,
                    acceptance_token: data.acceptanceToken,
                    accept_personal_auth:
                        data.personalDataAuthToken,
                    session_id: data.sessionId,
                }),
            },
            'payment source creation',
        );
    }

    /**
     * Genera la firma de integridad de una transacción.
     */
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

    /**
     * Crea una transacción en Wompi.
     */
    async createTransaction(data: {
        amountInCents: bigint;
        currency: string;
        reference: string;
        customerEmail: string;
        paymentSourceId: string;
        installments: number;
        sessionId: string;
        acceptanceToken: string;
    }): Promise<WompiTransactionResponse> {
        if (
            data.amountInCents <= 0n ||
            data.amountInCents >
                BigInt(Number.MAX_SAFE_INTEGER)
        ) {
            throw new InternalServerErrorException(
                'El importe de la transacción no es válido.',
            );
        }

        if (
            !data.reference?.trim() ||
            !data.currency?.trim() ||
            !data.customerEmail?.trim() ||
            !data.paymentSourceId?.trim() ||
            !data.sessionId?.trim() ||
            !data.acceptanceToken?.trim()
        ) {
            throw new InternalServerErrorException(
                'Faltan datos requeridos para crear la transacción.',
            );
        }

        if (
            !Number.isInteger(data.installments) ||
            data.installments < 1
        ) {
            throw new InternalServerErrorException(
                'El número de cuotas no es válido.',
            );
        }

        const signature =
            this.generateIntegritySignature(
                data.reference,
                data.amountInCents,
                data.currency,
            );

        const result =
            await this.requestJson<WompiTransactionResponse>(
                `${this.apiUrl}/transactions`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${this.privateKey}`,
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({
                        amount_in_cents: Number(
                            data.amountInCents,
                        ),
                        currency: data.currency,
                        public_key: this.publicKey,
                        customer_email: data.customerEmail,
                        reference: data.reference,
                        payment_source_id: data.paymentSourceId,
                        payment_method: {
                            type: 'CARD',
                            installments: data.installments,
                        },
                        signature,
                        acceptance_token: data.acceptanceToken,
                        session_id: data.sessionId,
                    }),
                },
                'transaction creation',
            );

        this.validateTransactionResponse(result);

        return result;
    }

    /**
     * Consulta una transacción existente por su identificador.
     * No crea cobros ni modifica la base de datos local.
     */
    async getTransaction(
        transactionId: string,
    ): Promise<WompiTransactionResponse> {
        if (
            typeof transactionId !== 'string' ||
            !transactionId.trim()
        ) {
            throw new InternalServerErrorException(
                'Se requiere un identificador de transacción válido.',
            );
        }

        const result =
            await this.requestJson<WompiTransactionResponse>(
                `${this.apiUrl}/transactions/${encodeURIComponent(transactionId)}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${this.privateKey}`,
                        Accept: 'application/json',
                    },
                },
                'transaction lookup',
            );

        this.validateTransactionResponse(result);

        if (result.data.id !== transactionId) {
            throw new ServiceUnavailableException(
                'El identificador de la transacción no coincide.',
            );
        }

        return result;
    }

    /**
     * Valida los campos básicos de una respuesta de transacción.
     */
    private validateTransactionResponse(
        response: WompiTransactionResponse,
    ): void {
        const transaction = response?.data;

        if (
            !transaction ||
            typeof transaction.id !== 'string' ||
            !transaction.id.trim() ||
            typeof transaction.reference !== 'string' ||
            !transaction.reference.trim() ||
            typeof transaction.status !== 'string' ||
            !transaction.status.trim() ||
            !Number.isSafeInteger(
                transaction.amount_in_cents,
            ) ||
            transaction.amount_in_cents < 0 ||
            typeof transaction.currency !== 'string' ||
            !transaction.currency.trim()
        ) {
            throw new ServiceUnavailableException(
                'Wompi devolvió una respuesta de transacción inválida.',
            );
        }
    }

    /**
     * Ejecuta solicitudes HTTP con timeout y errores controlados.
     * No expone el cuerpo de error de Wompi al cliente.
     */
    private async requestJson<T>(
        url: string,
        init: RequestInit,
        operation: string,
    ): Promise<T> {
        let response: Response;

        try {
            response = await fetch(url, {
                ...init,
                signal: AbortSignal.timeout(15_000),
            });
        } catch {
            throw new ServiceUnavailableException({
                message:
                    `No fue posible completar la operación de Wompi: ${operation}.`,
                provider: 'WOMPI',
            });
        }

        if (!response.ok) {
            try {
                await response.text();
            } catch {
                // No alteramos el error original.
            }

            throw new ServiceUnavailableException({
                message:
                    `Wompi no pudo completar la operación: ${operation}.`,
                provider: 'WOMPI',
                providerStatus: response.status,
            });
        }

        try {
            return await response.json() as T;
        } catch {
            throw new ServiceUnavailableException(
                'Wompi devolvió una respuesta JSON inválida.',
            );
        }
    }
}