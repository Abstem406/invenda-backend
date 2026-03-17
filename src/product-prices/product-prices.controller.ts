import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ProductPricesService } from './product-prices.service';
import { CreateProductPriceDto } from './dto/create-product-price.dto';
import { UpdateProductPriceDto } from './dto/update-product-price.dto';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('product-prices')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('product-prices')
export class ProductPricesController {
    constructor(private readonly productPricesService: ProductPricesService) { }

    @Get()
    @ApiOperation({ summary: 'Get all product prices with product info' })
    findAll() {
        return this.productPricesService.findAll();
    }

    @Get(':productId')
    @ApiOperation({ summary: 'Get price for a specific product' })
    findOne(@Param('productId') productId: string) {
        return this.productPricesService.findOne(productId);
    }

    @Post()
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Create price for a product that has no price yet' })
    create(@Body() createDto: CreateProductPriceDto) {
        return this.productPricesService.create(createDto);
    }

    @Patch(':productId')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Update price for a specific product' })
    update(@Param('productId') productId: string, @Body() updateDto: UpdateProductPriceDto) {
        return this.productPricesService.update(productId, updateDto);
    }

    @Delete(':productId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Delete price for a specific product' })
    remove(@Param('productId') productId: string) {
        return this.productPricesService.remove(productId);
    }
}
