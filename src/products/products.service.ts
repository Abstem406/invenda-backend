import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdatePricesDto } from './dto/update-prices.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { Product, Prisma } from '../../generated/prisma/client';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) { }

    async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<Product>> {
        const { page = 1, limit = 10, search } = paginationDto;
        const skip = (page - 1) * limit;

        const where: Prisma.ProductWhereInput = search
            ? { name: { contains: search, mode: 'insensitive' } }
            : {};

        const [data, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                skip,
                take: limit,
                include: { category: true },
            }),
            this.prisma.product.count({ where }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async create(createProductDto: CreateProductDto) {
        const { prices, ...rest } = createProductDto;
        return this.prisma.product.create({
            data: {
                ...rest,
                prices: prices as any,
            },
        });
    }

    async update(id: string, updateProductDto: UpdateProductDto) {
        const { prices, ...rest } = updateProductDto;

        const data: any = {};
        if (rest.name !== undefined) data.name = rest.name;
        if (rest.status !== undefined) data.status = rest.status;
        if (rest.categoryId !== undefined) data.categoryId = rest.categoryId;
        if (rest.stock !== undefined) data.stock = rest.stock;
        if (prices !== undefined) data.prices = prices;

        return this.prisma.product.update({
            where: { id },
            data,
        });
    }

    async remove(id: string) {
        return this.prisma.product.delete({
            where: { id },
        });
    }

    async updatePrices(id: string, updatePricesDto: UpdatePricesDto) {
        return this.prisma.product.update({
            where: { id },
            data: {
                prices: updatePricesDto as any,
            },
        });
    }
}
