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
            where: {
                product: {
                    deletedAt: null,
                },
            },
            include: {
                product: {
                    include: { category: true },
                },
            },
        });
    }

    // Return the price record for a single product
    async findOne(identifier: string) {
        const price = await this.prisma.productPrice.findFirst({
            where: {
                OR: [
                    { productId: identifier },
                    { id: identifier }
                ],
                product: {
                    deletedAt: null,
                },
            },
            include: {
                product: {
                    include: { category: true },
                },
            },
        });
        if (!price) throw new NotFoundException('Price not found');
        return price;
    }

    // Create a price record for a product that doesn't have one yet
    async create(dto: CreateProductPriceDto) {
        // Ensure the product exists
        const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
        if (!product) throw new NotFoundException('Product not found');

        // Ensure no ACTIVE price already exists for this product
        const existing = await this.prisma.productPrice.findFirst({ where: { productId: dto.productId } });
        if (existing) throw new ConflictException('Price already exists for this product. Use PATCH to update.');

        // Upsert allows us to restore a soft-deleted price if one exists,
        // preventing the "duplicate key value violates unique constraint" error.
        return this.prisma.productPrice.upsert({
            where: { productId: dto.productId },
            create: dto,
            update: {
                ...dto,
                deletedAt: null,
            },
            include: {
                product: {
                    include: { category: true },
                },
            },
        });
    }

    // Update an existing price record
    async update(identifier: string, dto: UpdateProductPriceDto) {
        const existing = await this.prisma.productPrice.findFirst({
            where: { OR: [{ productId: identifier }, { id: identifier }] }
        });
        if (!existing) throw new NotFoundException('Price not found');

        return this.prisma.productPrice.update({
            where: { id: existing.id },
            data: dto,
            include: {
                product: {
                    include: { category: true },
                },
            },
        });
    }

    // Remove a price record
    async remove(identifier: string) {
        const existing = await this.prisma.productPrice.findFirst({
            where: { OR: [{ productId: identifier }, { id: identifier }] }
        });
        if (!existing) throw new NotFoundException('Price not found');

        return this.prisma.productPrice.delete({ where: { id: existing.id } });
    }
}
