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
        return this.prisma.$transaction(async (tx) => {
            const rates = await tx.exchangeRates.upsert({
                where: { id: 'singleton' },
                update: updateDto,
                create: {
                    id: 'singleton',
                    ...updateDto,
                },
            });

            // Update prices where base is USD
            const productsUsdBase = await tx.productPrice.findMany({
                where: { exchangeType: 'usd' }
            });

            for (const price of productsUsdBase) {
                const dataToUpdate: any = {};
                if (!price.isCustomCop) dataToUpdate.cop = price.usdFisico * rates.copUsd;
                if (!price.isCustomVes) dataToUpdate.ves = price.usdFisico * rates.bcv;

                if (Object.keys(dataToUpdate).length > 0) {
                    await tx.productPrice.update({
                        where: { id: price.id },
                        data: dataToUpdate
                    });
                }
            }

            // Update prices where base is COP
            const productsCopBase = await tx.productPrice.findMany({
                where: { exchangeType: 'cop' }
            });

            for (const price of productsCopBase) {
                const dataToUpdate: any = {};
                const calculatedUsd = price.cop / rates.copUsd;

                if (!price.isCustomUsdFisico) dataToUpdate.usdFisico = calculatedUsd;
                if (!price.isCustomUsdTarjeta) dataToUpdate.usdTarjeta = calculatedUsd;
                if (!price.isCustomVes) dataToUpdate.ves = calculatedUsd * rates.bcv;

                if (Object.keys(dataToUpdate).length > 0) {
                    await tx.productPrice.update({
                        where: { id: price.id },
                        data: dataToUpdate
                    });
                }
            }

            return rates;
        });
    }
}
