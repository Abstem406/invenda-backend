import { Type } from 'class-transformer';
import {
    IsString,
    IsNumber,
    IsOptional,
    IsBoolean,
    ValidateNested,
    IsNotEmpty,
    IsIn,
    Min,
    IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PricesDto {
    @ApiProperty()
    @IsNumber()
    @Min(0, { message: 'El precio USD tarjeta no puede ser negativo' })
    usdTarjeta: number;

    @ApiProperty()
    @IsNumber()
    @Min(0, { message: 'El precio USD físico no puede ser negativo' })
    usdFisico: number;

    @ApiProperty()
    @IsNumber()
    @Min(0, { message: 'El precio COP no puede ser negativo' })
    cop: number;

    @ApiProperty()
    @IsNumber()
    @Min(0, { message: 'El precio VES no puede ser negativo' })
    ves: number;

    @ApiProperty({ enum: ['usd', 'cop'] })
    @IsString()
    @IsNotEmpty({ message: 'El tipo de cambio es requerido' })
    @IsIn(['usd', 'cop'], { message: 'El tipo de cambio debe ser "usd" o "cop"' })
    exchangeType: 'usd' | 'cop';

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    isCustomUsdTarjeta?: boolean;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    isCustomUsdFisico?: boolean;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    isCustomCop?: boolean;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    isCustomVes?: boolean;
}

export class CreateProductDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'El nombre del producto es requerido' })
    name: string;

    @ApiProperty({ enum: [1, 2] })
    @IsNumber()
    @IsIn([1, 2], { message: 'El estado debe ser 1 (activo) o 2 (inactivo)' })
    status: 1 | 2;

    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'La categoría es requerida' })
    categoryId: string;

    @ApiProperty()
    @IsInt({ message: 'El stock debe ser un número entero' })
    @Min(0, { message: 'El stock no puede ser negativo' })
    stock: number;

    @ApiPropertyOptional({ type: () => PricesDto })
    @ValidateNested()
    @Type(() => PricesDto)
    @IsOptional()
    price?: PricesDto;
}
