import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';
import { ExchangeRatesDto } from './dto/exchange-rates.dto';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('exchange-rates')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exchange-rates')
export class ExchangeRatesController {
    constructor(private readonly exchangeRatesService: ExchangeRatesService) { }

    @Get()
    @ApiOperation({ summary: 'Get current exchange rates' })
    getRates() {
        return this.exchangeRatesService.getRates();
    }

    @Put()
    @Roles('ADMIN', 'CAJERO')
    @ApiOperation({ summary: 'Update global exchange rates' })
    updateRates(@Body() updateDto: ExchangeRatesDto) {
        return this.exchangeRatesService.updateRates(updateDto);
    }
}
