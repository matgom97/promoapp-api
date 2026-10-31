import {
  IsEnum,
  IsNotEmpty,
} from 'class-validator';

export enum RestaurantStatusUpdate {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class UpdateRestaurantStatusDto {
  @IsEnum(RestaurantStatusUpdate)
  @IsNotEmpty()
  status!: RestaurantStatusUpdate;
}