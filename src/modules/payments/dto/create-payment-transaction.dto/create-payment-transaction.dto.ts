import {
  IsInt,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePaymentTransactionDto {

  @IsString()
  @MaxLength(191)
  subscriptionId!: string;


  @IsString()
  @MaxLength(191)
  paymentMethodId!: string;


  @IsInt()
  @Min(1)
  installments!: number;


  @IsString()
  @MaxLength(191)
  sessionId!: string;

}