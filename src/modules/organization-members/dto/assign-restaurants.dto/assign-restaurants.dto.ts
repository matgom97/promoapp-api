import {
  IsArray,
  IsBoolean,
  IsString,
  ArrayUnique,
  ValidateIf,
} from 'class-validator';

export class AssignRestaurantsDto {
  @IsBoolean()
  allRestaurants!: boolean;

  @ValidateIf((dto: AssignRestaurantsDto) => !dto.allRestaurants)
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  restaurantIds?: string[];
}