import {
  ArrayUnique,
  IsArray,
  IsString,
} from 'class-validator';

export class AssignRolePermissionsDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissionIds: string[];
}