import {
  IsArray,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  Max,
  ArrayUnique,
} from 'class-validator';

import { Transform, Type } from 'class-transformer';
import { MembershipRole } from '@prisma/client';



export class QueryOrganizationMembersDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === 'string') {
      return value.split(',').filter(Boolean);
    }

    return value;
  })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  restaurantIds?: string[];

  @IsOptional()
  @IsEnum(MembershipRole)
  role?: MembershipRole;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  allRestaurants?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}