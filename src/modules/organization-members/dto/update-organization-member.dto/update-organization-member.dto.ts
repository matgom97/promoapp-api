import { MembershipRole } from '@prisma/client';

import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
  ValidateIf,
} from 'class-validator';

export class UpdateOrganizationMemberDto {
  @IsOptional()
  @IsEnum(MembershipRole)
  role?: MembershipRole;

  @IsOptional()
  @IsBoolean()
  allRestaurants?: boolean;

  /**
   * La contraseña solo se valida cuando se envía.
   * Debe contener al menos 12 caracteres, una mayúscula,
   * una minúscula, un número y un carácter especial permitido.
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
      'Utiliza letras, números y los siguientes caracteres especiales: ' +
      '! @ # $ % ^ & * ( ) _ - + = [ ] { } ; : , . ?',
  })
  password?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  restaurantIds?: string[];
}