import {
    BadRequestException,
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Version,
} from '@nestjs/common';

import { WompiWebhookService } from '../../services/wompi-webhook/wompi-webhook/wompi-webhook.service.js';

interface WompiWebhookPayload {
    event: string;
    data: {
        transaction: {
            id: string;
            reference: string;
            amount_in_cents: number;
            currency: string;
            status: string;
        };
    };
    environment: 'test' | 'prod';
    signature: {
        properties: string[];
        checksum: string;
    };
    timestamp: number;
    sent_at?: string;
}

@Controller('payments/wompi')
export class WompiWebhookController {
    constructor(
        private readonly wompiWebhookService: WompiWebhookService,
    ) {}

    @Post('webhook')
    @Version('1')
    @HttpCode(HttpStatus.OK)
    async handleWebhook(
        @Body() body: WompiWebhookPayload,
    ) {
        this.validatePayload(body);

        return this.wompiWebhookService.processTransactionUpdated(
            body,
        );
    }

    /**
     * Validación estructural básica.
     * La autenticidad del evento se verifica en el servicio.
     */
    private validatePayload(
        body: WompiWebhookPayload,
    ): void {
        if (
            !body ||
            typeof body !== 'object' ||
            body.event !== 'transaction.updated'
        ) {
            throw new BadRequestException(
                'Invalid Wompi webhook event',
            );
        }

        const transaction = body.data?.transaction;

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
            throw new BadRequestException(
                'Invalid Wompi transaction payload',
            );
        }

        if (
            !body.signature ||
            !Array.isArray(body.signature.properties) ||
            typeof body.signature.checksum !== 'string' ||
            typeof body.timestamp !== 'number'
        ) {
            throw new BadRequestException(
                'Invalid Wompi webhook signature payload',
            );
        }
    }
}