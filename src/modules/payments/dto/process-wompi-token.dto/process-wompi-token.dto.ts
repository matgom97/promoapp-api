import {
    IsIn,
    IsNotEmpty,
    IsString,
    MaxLength,
} from 'class-validator';

export class ProcessWompiTokenDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(191)
    payment_source_token!: string;

    @IsString()
    @IsIn(['CARD'])
    payment_source_type!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(191)
    subscriptionId!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(191)
    sessionId!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(2048)
    paymentAuthorizationToken!: string;
}