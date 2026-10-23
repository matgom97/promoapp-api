import {
    IsNotEmpty,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreatePaymentMethodDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(191)
    token!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(191)
    sessionId!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(191)
    subscriptionId!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    acceptanceToken!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    personalDataAuthToken!: string;
}