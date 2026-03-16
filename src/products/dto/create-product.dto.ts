import { Type } from 'class-transformer';
import { IsString, IsNumber, IsOptional, IsBoolean, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PricesDto {
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
    isCustomVes?: boolean;
}

export class CreateProductDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty({ enum: [1, 2] })
    @IsNumber()
    status: 1 | 2;

    @ApiProperty()
    @IsString()
    categoryId: string;

    @ApiProperty()
    @IsNumber()
    stock: number;

    @ApiProperty({ type: () => PricesDto })
    @ValidateNested()
    @Type(() => PricesDto)
    price: PricesDto;
}
