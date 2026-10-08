import {
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePaymentMethodDto {

  @IsString()
  @MaxLength(191)
  token!: string;

  @IsString()
  @MaxLength(191)
  sessionId!: string;

  @IsString()
  @MaxLength(191)
  subscriptionId!: string;

  @IsString()
  @MaxLength(500)
  acceptanceToken!: string;

  @IsString()
  @MaxLength(500)
  personalDataAuthToken!: string;

}