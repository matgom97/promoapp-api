import {
  IsString,
  MaxLength,
} from 'class-validator';

export class ProcessWompiTokenDto {
  @IsString()
  @MaxLength(191)
  payment_source_token!: string;

  @IsString()
  @MaxLength(50)
  payment_source_type!: string;

  @IsString()
  @MaxLength(191)
  subscriptionId!: string;

  @IsString()
  @MaxLength(191)
  sessionId!: string;

  @IsString()
  @MaxLength(2048)
  paymentAuthorizationToken!: string;
}