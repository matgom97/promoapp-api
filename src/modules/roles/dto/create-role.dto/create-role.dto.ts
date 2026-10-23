import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ArrayUnique,
  IsBoolean,
} from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  code: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissionIds: string[];
}