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
  Matches,
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
  @MinLength(8, {
    message: 'La contraseña debe tener al menos 8 caracteres.',
  })
  @MaxLength(128, {
    message: 'La contraseña no puede superar los 128 caracteres.',
  })
  @Matches(/[A-Z]/, {
    message: 'La contraseña debe contener al menos una mayúscula.',
  })
  @Matches(/[a-z]/, {
    message: 'La contraseña debe contener al menos una minúscula.',
  })
  @Matches(/[0-9]/, {
    message: 'La contraseña debe contener al menos un número.',
  })
  @Matches(/[^A-Za-z0-9\s]/, {
    message: 'La contraseña debe contener al menos un carácter especial.',
  })
  @Matches(/^[A-Za-z0-9!@#$%^&*()_\-+=[\]{};:,.?]+$/, {
    message:
      'La contraseña contiene caracteres no permitidos. ' +
      'Utiliza letras, números y caracteres especiales permitidos.',
  })
  password?: string;

  @IsEnum(MembershipRole)
  role!: MembershipRole;

  @IsBoolean()
  allRestaurants!: boolean;

  @ValidateIf(
    (dto: CreateOrganizationMemberDto) => !dto.allRestaurants,
  )
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  restaurantIds?: string[];
}