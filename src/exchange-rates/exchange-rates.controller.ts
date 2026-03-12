import { Controller, Get, Put, Body } from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';
import { ExchangeRatesDto } from './dto/exchange-rates.dto';

@Controller('exchange-rates')
export class ExchangeRatesController {
    constructor(private readonly exchangeRatesService: ExchangeRatesService) { }

    @Get()
    getRates() {
        return this.exchangeRatesService.getRates();
    }

    @Put()
    updateRates(@Body() updateDto: ExchangeRatesDto) {
        return this.exchangeRatesService.updateRates(updateDto);
    }
}
