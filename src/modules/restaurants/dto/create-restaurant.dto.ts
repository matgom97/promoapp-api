import { Transform } from 'class-transformer';

import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl,
    Length,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

const EmptyToNull = () =>
    Transform(({ value }) => {
        if (typeof value === 'string' && value.trim() === '') {
            return null;
        }

        return value;
    });

export class CreateRestaurantDto {
    @IsString()
    @IsNotEmpty()
    @Length(2, 150)
    name!: string;

    @EmptyToNull()
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string | null;

    @EmptyToNull()
    @IsOptional()
    @IsString()
    @MaxLength(30)
    phone?: string | null;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    address!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    city!: string;

    @EmptyToNull()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    department?: string | null;

    @IsOptional()
    @IsNumber({
        allowNaN: false,
        allowInfinity: false,
    })
    @Min(-90)
    @Max(90)
    latitude?: number;

    @IsOptional()
    @IsNumber({
        allowNaN: false,
        allowInfinity: false,
    })
    @Min(-180)
    @Max(180)
    longitude?: number;

    @EmptyToNull()
    @IsOptional()
    @IsUrl({
        require_protocol: true,
    })
    @MaxLength(255)
    website?: string | null;

    @EmptyToNull()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    instagram?: string | null;

    @EmptyToNull()
    @IsOptional()
    @IsUrl({
        require_protocol: true,
    })
    @MaxLength(255)
    facebook?: string | null;
}