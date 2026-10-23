import { MembershipRole } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ArrayUnique,
} from 'class-validator';



export class UpdateOrganizationMemberDto {
  @IsOptional()
  @IsEnum(MembershipRole)
  role?: MembershipRole;

  @IsOptional()
  @IsBoolean()
  allRestaurants?: boolean;

  // Contraseña: Se permite que sea opcional, ya que no siempre se requiere actualizar la contraseña al modificar un miembro de la organización.
  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  restaurantIds?: string[];
}