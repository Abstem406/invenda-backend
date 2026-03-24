import { IsNumber, IsPositive } from 'class-validator';

export class ExchangeRatesDto {
    @IsNumber()
    @IsPositive({ message: 'La tasa COP debe ser mayor que 0' })
    cop: number;

    @IsNumber()
    @IsPositive({ message: 'La tasa BCV debe ser mayor que 0' })
    bcv: number;

    @IsNumber()
    @IsPositive({ message: 'La tasa COP/USD debe ser mayor que 0' })
    copUsd: number;
}
