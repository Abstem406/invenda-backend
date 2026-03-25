import { Type } from 'class-transformer';
import {
    IsString,
    IsNumber,
    IsArray,
    ValidateNested,
    IsIn,
    Min,
    IsInt,
    IsNotEmpty,
    IsUUID,
    ArrayMinSize,
    IsOptional,
} from 'class-validator';
import { PricesDto } from '../../products/dto/create-product.dto';

class PaymentMethodDto {
    @IsNumber()
    @Min(0, { message: 'El monto en USD físico no puede ser negativo' })
    usdFisico: number;

    @IsNumber()
    @Min(0, { message: 'El monto en USD tarjeta no puede ser negativo' })
    usdTarjeta: number;

    @IsNumber()
    @Min(0, { message: 'El monto en COP no puede ser negativo' })
    cop: number;

    @IsNumber()
    @Min(0, { message: 'El monto en VES no puede ser negativo' })
    ves: number;
}

class SaleItemDto {
    @IsString()
    @IsNotEmpty({ message: 'El ID del producto no puede estar vacío' })
    @IsUUID('4', { message: 'El ID del producto debe ser un UUID válido' })
    productId: string;

    @IsInt({ message: 'La cantidad debe ser un número entero' })
    @Min(1, { message: 'La cantidad debe ser al menos 1' })
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
    @ArrayMinSize(1, { message: 'Debe incluir al menos un producto en la venta' })
    @ValidateNested({ each: true })
    @Type(() => SaleItemDto)
    items: SaleItemDto[];

    @IsOptional()
    @IsString()
    customerName?: string;

    @ValidateNested()
    @Type(() => PaymentMethodDto)
    receivedTotals: PaymentMethodDto;

    @IsString()
    @IsIn(['pagado', 'fiado', 'debiendo'])
    status: 'pagado' | 'fiado' | 'debiendo';
}
