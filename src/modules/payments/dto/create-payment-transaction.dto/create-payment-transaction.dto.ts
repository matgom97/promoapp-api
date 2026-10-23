import {
    IsInt,
    IsNotEmpty,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

export class CreatePaymentTransactionDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(191)
    subscriptionId!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(191)
    paymentMethodId!: string;

    @IsInt()
    @Min(1)
    @Max(36)
    installments!: number;

    @IsString()
    @IsNotEmpty()
    @MaxLength(191)
    sessionId!: string;
}