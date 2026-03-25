import { Type } from 'class-transformer';
import { ValidateNested, IsBoolean, IsOptional } from 'class-validator';

// Reusing PaymentMethodDto from create-sale for consistency
import { IsNumber, Min } from 'class-validator';

export class PaymentMethodDto {
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


export class PaySaleDto {
    @ValidateNested()
    @Type(() => PaymentMethodDto)
    payment: PaymentMethodDto;

    @IsBoolean()
    @IsOptional()
    isFullyPaid?: boolean;
}
