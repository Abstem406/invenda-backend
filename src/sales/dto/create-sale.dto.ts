import { Type } from 'class-transformer';
import { IsString, IsNumber, IsArray, ValidateNested, IsIn } from 'class-validator';
import { PricesDto } from '../../products/dto/create-product.dto';

class PaymentMethodDto {
    @IsNumber()
    usdFisico: number;

    @IsNumber()
    usdTarjeta: number;

    @IsNumber()
    cop: number;

    @IsNumber()
    ves: number;
}

class SaleItemDto {
    @IsString()
    productId: string;

    @IsNumber()
    quantity: number;

    @ValidateNested()
    @Type(() => PricesDto)
    unitPrice: PricesDto;

    @ValidateNested()
    @Type(() => PricesDto)
    totalPrice: PricesDto;

    @ValidateNested()
    @Type(() => PaymentMethodDto)
    payments: PaymentMethodDto;
}

export class CreateSaleDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SaleItemDto)
    items: SaleItemDto[];

    @ValidateNested()
    @Type(() => PaymentMethodDto)
    receivedTotals: PaymentMethodDto;

    @IsString()
    @IsIn(['pagado', 'fiado', 'debiendo'])
    status: 'pagado' | 'fiado' | 'debiendo';
}
