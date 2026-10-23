import { MembershipRole } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  ArrayUnique,
  ValidateIf,
} from 'class-validator';

export class CreateOrganizationMemberDto {
  @IsEmail()
  @MaxLength(191)
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName!: string;

  /**
   * Solo es necesaria cuando se crea un usuario nuevo.
   * Para usuarios existentes no se modifica la contraseña.
   */
  @IsOptional()
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password?: string;

  @IsEnum(MembershipRole)
  role!: MembershipRole;

  @IsBoolean()
  allRestaurants!: boolean;

  @ValidateIf((dto: CreateOrganizationMemberDto) => !dto.allRestaurants)
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  restaurantIds?: string[];
}