import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { Sale, Prisma } from '../../generated/prisma/client';

@Injectable()
export class SalesService {
    constructor(private prisma: PrismaService) { }

    async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<Sale>> {
        const { page = 1, limit = 10, search } = paginationDto;
        const skip = (page - 1) * limit;

        const where: Prisma.SaleWhereInput = search
            ? { status: { contains: search, mode: 'insensitive' } }
            : {};

        const [data, total] = await Promise.all([
            this.prisma.sale.findMany({
                where,
                skip,
                take: limit,
                include: { items: true },
                orderBy: { date: 'desc' },
            }),
            this.prisma.sale.count({ where }),
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

    async create(createSaleDto: CreateSaleDto) {
        return this.prisma.$transaction(async (tx) => {
            // 0. Validate payments: non-fiado sales must have at least one payment > 0
            if (createSaleDto.status !== 'fiado') {
                const { usdFisico, usdTarjeta, cop, ves } = createSaleDto.receivedTotals;
                const totalReceived = usdFisico + usdTarjeta + cop + ves;
                if (totalReceived <= 0) {
                    throw new BadRequestException(
                        'Debe registrar un monto en al menos una divisa. Solo las ventas con estado "fiado" pueden tener montos en 0.',
                    );
                }
            }

            // 1. Process each item and deduct stock
            for (const item of createSaleDto.items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                    include: { price: true },
                });

                if (!product) {
                    throw new BadRequestException(`El producto con ID ${item.productId} no existe.`);
                }

                if (!product.price) {
                    throw new BadRequestException(`El producto "${product.name}" no tiene un precio configurado. No se puede vender.`);
                }

                if (product.stock < item.quantity) {
                    throw new BadRequestException(`Sin stock suficiente para el producto: ${product.name}`);
                }

                // Validate that unit prices match configured product prices
                const configuredPrice = product.price as any;
                const sentPrice = item.unitPrice;

                const priceFields = ['usdTarjeta', 'usdFisico', 'cop', 'ves'] as const;
                for (const field of priceFields) {
                    if (
                        typeof sentPrice[field] !== 'number' ||
                        sentPrice[field] !== configuredPrice[field]
                    ) {
                        throw new BadRequestException(
                            `El precio unitario "${field}" del producto "${product.name}" no coincide con el precio configurado. ` +
                            `Esperado: ${configuredPrice[field]}, recibido: ${sentPrice[field]}.`,
                        );
                    }
                }

                // Deduct stock (cannot be negative due to previous check)
                await tx.product.update({
                    where: { id: product.id },
                    data: {
                        stock: product.stock - item.quantity,
                    },
                });
            }

            // 2. Create the Sale and SaleItems
            const { items, ...saleData } = createSaleDto;

            const newSale = await tx.sale.create({
                data: {
                    ...saleData,
                    receivedTotals: saleData.receivedTotals as any,
                    items: {
                        create: items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice as any,
                            totalPrice: item.totalPrice as any,
                            payments: item.payments as any,
                        })),
                    },
                },
                include: {
                    items: true,
                },
            });

            return newSale;
        });
    }
}
