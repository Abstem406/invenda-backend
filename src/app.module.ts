import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { ExchangeRatesModule } from './exchange-rates/exchange-rates.module';
import { SalesModule } from './sales/sales.module';

@Module({
    imports: [ConfigModule.forRoot(), PrismaModule, CategoriesModule, ProductsModule, ExchangeRatesModule, SalesModule],
    controllers: [],
    providers: [],
})
export class AppModule { }