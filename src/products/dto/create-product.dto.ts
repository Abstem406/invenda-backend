import { Type } from 'class-transformer';
import { IsString, IsNumber, IsOptional, IsBoolean, ValidateNested } from 'class-validator';

export class PricesDto {
    @IsNumber()
    usdTarjeta: number;

    @IsNumber()
    usdFisico: number;

    @IsNumber()
    cop: number;

    @IsNumber()
    ves: number;

    @IsString()
    exchangeType: 'usd' | 'cop';

    @IsBoolean()
    @IsOptional()
    isCustomVes?: boolean;
}

export class CreateProductDto {
    @IsString()
    name: string;

    @IsNumber()
    status: 1 | 2;

    @IsString()
    categoryId: string;

    @IsNumber()
    stock: number;

    @ValidateNested()
    @Type(() => PricesDto)
    prices: PricesDto;
}
