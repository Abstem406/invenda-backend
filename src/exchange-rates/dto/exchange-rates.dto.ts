import { IsNumber } from 'class-validator';

export class ExchangeRatesDto {
    @IsNumber()
    cop: number;

    @IsNumber()
    bcv: number;

    @IsNumber()
    copUsd: number;
}
