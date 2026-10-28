import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsEmail,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
    MinLength,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterRestaurantDto {
    @IsString()
    @MinLength(2)
    @MaxLength(150)
    name!: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsString()
    @MaxLength(30)
    phone?: string;

    @IsString()
    @MinLength(3)
    @MaxLength(255)
    address!: string;

    @IsString()
    @MinLength(2)
    @MaxLength(100)
    city!: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    department?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 7 })
    @Min(-90)
    @Max(90)
    latitude?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 7 })
    @Min(-180)
    @Max(180)
    longitude?: number;
}

export class RegisterDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name!: string;

    /**
     * Nombre comercial de la organización.
     * Todas las sedes se relacionarán con esta organización.
     */
    @IsString()
    @MinLength(2)
    @MaxLength(150)
    restaurantName!: string;

    @IsString()
    @MinLength(2)
    @MaxLength(50)
    cuisineCode!: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsString()
    @MaxLength(30)
    phone?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    planCode?: string;

    @IsString()
    @MinLength(2)
    @MaxLength(20)
    priceRangeCode!: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    website?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    instagram?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    facebook?: string;

    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    @ValidateNested({ each: true })
    @Type(() => RegisterRestaurantDto)
    restaurants!: RegisterRestaurantDto[];

    @IsEmail()
    @MaxLength(191)
    email!: string;

    @IsString()
    @MinLength(12)
    @MaxLength(128)
    password!: string;

    @IsBoolean()
    terms!: boolean;
}