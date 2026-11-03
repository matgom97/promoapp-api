import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
  IsInt,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PromotionFrequency, PromotionType } from '@prisma/client';

export class PromotionScheduleDto {
  @IsInt() @Min(1) @Max(7) dayOfWeek!: number;
  @IsString() startsAt!: string;
  @IsString() endsAt!: string;
}

export class PromotionImageDto {
  @IsUrl({ require_protocol: true }) url!: string;
  @IsOptional() @IsString() altText?: string;
}

export class CreatePromotionDto {
  @IsString() @MinLength(2) name!: string;
  @IsOptional() @IsString() shortDescription?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() termsAndConditions?: string;
  @IsEnum(PromotionType) type!: PromotionType;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100) discountPercentage?: number;
  @IsOptional() @IsNumber() @Min(0) discountAmount?: number;
  @IsOptional() @IsNumber() @Min(0) promotionalPrice?: number;
  @IsOptional() @IsString() benefitDescription?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => PromotionImageDto)
  images?: PromotionImageDto[];
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) restaurantIds?: string[];
  @IsOptional() @IsNumber() @Min(1) maxGlobalRedemptions?: number;
  @IsOptional() @IsNumber() @Min(1) maxRedemptionsPerCustomer?: number;
  @IsOptional() @IsNumber() @Min(1) intervalDays?: number;
  @IsOptional() @IsBoolean() allowCombination?: boolean;
  @IsOptional() @IsEnum(PromotionFrequency) frequency?: PromotionFrequency;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => PromotionScheduleDto)
  schedules?: PromotionScheduleDto[];
}

export class CreateRedemptionIntentDto {
  @IsString() @MinLength(1) promotionId!: string;
}

export class RedemptionTokenDto {
  @IsString() @MinLength(20) token!: string;
}

export class ConfirmRedemptionDto extends RedemptionTokenDto {
  @IsString() @MinLength(8) idempotencyKey!: string;
}

export class ReverseRedemptionDto {
  @IsString() @MinLength(3) reason!: string;
}

export class RegisterCustomerProfileDto {
  @IsBoolean() acceptPrivacy!: boolean;
}
