import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { ExchangeRatesModule } from './exchange-rates/exchange-rates.module';
import { SalesModule } from './sales/sales.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductPricesModule } from './product-prices/product-prices.module';

@Module({
    imports: [ConfigModule.forRoot(), PrismaModule, AuthModule, CategoriesModule, ProductsModule, ProductPricesModule, ExchangeRatesModule, SalesModule, UsersModule],
    controllers: [],
    providers: [],
})
export class AppModule { }