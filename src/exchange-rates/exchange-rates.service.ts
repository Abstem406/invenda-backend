import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ExchangeRatesDto } from './dto/exchange-rates.dto';

@Injectable()
export class ExchangeRatesService {
    constructor(private prisma: PrismaService) { }

    async getRates() {
        let rates = await this.prisma.exchangeRates.findUnique({
            where: { id: 'singleton' },
        });

        if (!rates) {
            // Default fallback values as per specification
            rates = await this.prisma.exchangeRates.create({
                data: {
                    id: 'singleton',
                    cop: 5,
                    bcv: 435,
                    copUsd: 3754,
                },
            });
        }
        return rates;
    }

    async updateRates(updateDto: ExchangeRatesDto) {
        return this.prisma.exchangeRates.upsert({
            where: { id: 'singleton' },
            update: updateDto,
            create: {
                id: 'singleton',
                ...updateDto,
            },
        });
    }
}
