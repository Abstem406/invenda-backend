import { IsString, IsNumber, IsOptional, IsBoolean, IsNotEmpty, Min, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductPriceDto {
    @ApiProperty({ description: 'ID of the product to assign prices to' })
    @IsString()
    @IsNotEmpty({ message: 'El ID del producto es requerido' })
    productId: string;

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
