import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdatePricesDto } from './dto/update-prices.dto';
import { FindProductsDto } from './dto/find-products.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { Product, Prisma } from '../../generated/prisma/client';

const productInclude = {
    category: true,
    price: true,
};

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) { }

    async findAll(
        findProductsDto: FindProductsDto,
    ): Promise<PaginatedResult<Product>> {
        const { page = 1, limit = 10, search, hasPrice } = findProductsDto;
        const skip = (page - 1) * limit;

        const where: Prisma.ProductWhereInput = search
            ? { name: { contains: search, mode: 'insensitive' } }
            : {};

        if (hasPrice !== undefined) {
            where.price = hasPrice ? { isNot: null } : { is: null };
        }

        const [data, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                skip,
                take: limit,
                include: productInclude,
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
        const { price, ...rest } = createProductDto;
        return this.prisma.product.create({
            data: {
                ...rest,
                ...(price ? { price: { create: price } } : {}),
            },
            include: productInclude,
        });
    }

    async update(id: string, updateProductDto: UpdateProductDto) {
        const { price, ...rest } = updateProductDto;

        // Check product exists
        const existing = await this.prisma.product.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Product not found');

        const data: Prisma.ProductUpdateInput = {};
        if (rest.name !== undefined) data.name = rest.name;
        if (rest.status !== undefined) data.status = rest.status;
        if (rest.categoryId !== undefined)
            data.category = { connect: { id: rest.categoryId } };
        if (rest.stock !== undefined) data.stock = rest.stock;
        if (price !== undefined) {
            data.price = {
                upsert: {
                    create: price,
                    update: price,
                },
            };
        }

        return this.prisma.product.update({
            where: { id },
            data,
            include: productInclude,
        });
    }

    async remove(id: string) {
        const existing = await this.prisma.product.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Product not found');
        return this.prisma.product.delete({ where: { id } });
    }

    async updatePrices(id: string, updatePricesDto: UpdatePricesDto) {
        const existing = await this.prisma.product.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Product not found');

        return this.prisma.product.update({
            where: { id },
            data: {
                price: {
                    upsert: {
                        create: updatePricesDto,
                        update: updatePricesDto,
                    },
                },
            },
            include: productInclude,
        });
    }
}
