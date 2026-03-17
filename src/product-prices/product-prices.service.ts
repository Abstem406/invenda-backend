import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductPriceDto } from './dto/create-product-price.dto';
import { UpdateProductPriceDto } from './dto/update-product-price.dto';

@Injectable()
export class ProductPricesService {
    constructor(private prisma: PrismaService) { }

    // Return all product prices with product name and category
    async findAll() {
        return this.prisma.productPrice.findMany({
            include: {
                product: {
                    include: { category: true },
                },
            },
        });
    }

    // Return the price record for a single product
    async findOne(productId: string) {
        const price = await this.prisma.productPrice.findUnique({
            where: { productId },
            include: {
                product: {
                    include: { category: true },
                },
            },
        });
        if (!price) throw new NotFoundException('Price not found for this product');
        return price;
    }

    // Create a price record for a product that doesn't have one yet
    async create(dto: CreateProductPriceDto) {
        // Ensure the product exists
        const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
        if (!product) throw new NotFoundException('Product not found');

        // Ensure no price already exists for this product
        const existing = await this.prisma.productPrice.findUnique({ where: { productId: dto.productId } });
        if (existing) throw new ConflictException('Price already exists for this product. Use PATCH to update.');

        return this.prisma.productPrice.create({
            data: dto,
            include: {
                product: {
                    include: { category: true },
                },
            },
        });
    }

    // Update an existing price record
    async update(productId: string, dto: UpdateProductPriceDto) {
        const existing = await this.prisma.productPrice.findUnique({ where: { productId } });
        if (!existing) throw new NotFoundException('Price not found for this product');

        return this.prisma.productPrice.update({
            where: { productId },
            data: dto,
            include: {
                product: {
                    include: { category: true },
                },
            },
        });
    }

    // Remove a price record
    async remove(productId: string) {
        const existing = await this.prisma.productPrice.findUnique({ where: { productId } });
        if (!existing) throw new NotFoundException('Price not found for this product');

        return this.prisma.productPrice.delete({ where: { productId } });
    }
}
