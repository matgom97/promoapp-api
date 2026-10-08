import {
    Equals,
    IsBoolean,
    IsEmail,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
    MinLength,
} from 'class-validator';

export class RegisterDto {
    // Usuario
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name!: string;

    @IsEmail()
    @MaxLength(191)
    email!: string;

    @IsString()
    @MinLength(8)
    @MaxLength(128)
    password!: string;

    @IsBoolean()
    @Equals(true, {
        message: 'You must accept the terms and conditions',
    })
    terms!: boolean;

    // Restaurante
    @IsString()
    @MinLength(2)
    @MaxLength(150)
    restaurantName!: string;

    @IsString()
    @MaxLength(50)
    cuisineCode!: string;

    @IsString()
    @MinLength(20)
    @MaxLength(500)
    description!: string;

    @IsOptional()
    @IsString()
    @MaxLength(30)
    phone?: string;

    // Ubicación
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
    @IsNumber()
    latitude?: number;

    @IsOptional()
    @IsNumber()
    longitude?: number;

    // Información pública
    @IsString()
    @MaxLength(20)
    priceRangeCode!: string;

    @IsOptional()
    @IsUrl()
    @MaxLength(255)
    website?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    instagram?: string;

    @IsOptional()
    @IsUrl()
    @MaxLength(255)
    facebook?: string;

    // Plan
    @IsOptional()
    @IsString()
    @MaxLength(50)
    planCode?: string;
}