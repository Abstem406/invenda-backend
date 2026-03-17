import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductPriceDto {
    @ApiProperty({ description: 'ID of the product to assign prices to' })
    @IsString()
    productId: string;

    @ApiProperty()
    @IsNumber()
    usdTarjeta: number;

    @ApiProperty()
    @IsNumber()
    usdFisico: number;

    @ApiProperty()
    @IsNumber()
    cop: number;

    @ApiProperty()
    @IsNumber()
    ves: number;

    @ApiProperty({ enum: ['usd', 'cop'] })
    @IsString()
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
