import {
    IsNotEmpty,
    IsString,
    MaxLength,
} from 'class-validator';

export class AuthorizePaymentDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(191)
    subscriptionId!: string;
}
