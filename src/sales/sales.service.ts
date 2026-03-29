import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { PaySaleDto } from './dto/pay-sale.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { Sale, Prisma } from '../../generated/prisma/client';

@Injectable()
export class SalesService {
    constructor(private prisma: PrismaService) { }

    async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<Sale>> {
        const { page = 1, limit = 10, search, dateFrom, dateTo, userId, status } = paginationDto;
        const skip = (page - 1) * limit;

        const where: Prisma.SaleWhereInput = {};

        // Filter by status
        if (status) {
            where.status = status;
        }

        // Filter by customer name
        if (search) {
            where.customerName = { contains: search, mode: 'insensitive' };
        }

        // Filter by date range
        if (dateFrom || dateTo) {
            where.date = {};
            if (dateFrom) {
                where.date.gte = new Date(dateFrom);
            }
            if (dateTo) {
                // Set to end of day so the "to" date is inclusive
                const endDate = new Date(dateTo);
                endDate.setHours(23, 59, 59, 999);
                where.date.lte = endDate;
            }
        }

        // Filter by userId
        if (userId) {
            where.userId = userId;
        }

        const [data, total] = await Promise.all([
            this.prisma.sale.findMany({
                where,
                skip,
                take: limit,
                include: {
                    items: true,
                    user: { select: { id: true, name: true, email: true } },
                },
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

    async create(createSaleDto: CreateSaleDto, userId: string) {
        return this.prisma.$transaction(async (tx) => {
            // 0a. Fiado sales: force all payments to zero (safety net)
            if (createSaleDto.status === 'fiado') {
                const zeroPay = { usdFisico: 0, usdTarjeta: 0, cop: 0, ves: 0 };
                createSaleDto.receivedTotals = { ...zeroPay };
                createSaleDto.items.forEach(item => {
                    item.payments = { ...zeroPay };
                });
            }

            // 0b. Validate payments: non-fiado sales must have at least one payment > 0
            if (createSaleDto.status !== 'fiado') {
                const { usdFisico, usdTarjeta, cop, ves } = createSaleDto.receivedTotals;
                const activePayments = [usdFisico, usdTarjeta, cop, ves].filter(amount => amount > 0);
                
                const totalReceived = usdFisico + usdTarjeta + cop + ves;
                if (totalReceived <= 0) {
                    throw new BadRequestException(
                        'Debe registrar un monto en al menos una divisa. Solo las ventas con estado "fiado" pueden tener montos en 0.',
                    );
                }

                if (createSaleDto.status === 'debiendo' && activePayments.length > 1) {
                    throw new BadRequestException(
                        'Las ventas fraccionadas (debiendo) solo pueden ser iniciadas utilizando una única moneda de pago.',
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
                    userId,
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
                    user: { select: { id: true, name: true, email: true } },
                },
            });

            return newSale;
        });
    }

    async paySale(id: string, paySaleDto: PaySaleDto) {
        return this.prisma.$transaction(async (tx) => {
            const sale = await tx.sale.findUnique({ where: { id } });
            if (!sale) {
                throw new BadRequestException(`La venta no existe.`);
            }

            if (sale.status === 'pagado') {
                throw new BadRequestException('Esta venta ya está pagada por completo.');
            }

            const currentTotals = sale.receivedTotals as { usdFisico: number, usdTarjeta: number, cop: number, ves: number };
            const { payment, isFullyPaid } = paySaleDto;

            if (sale.status === 'debiendo') {
                const usedCurrencies = [];
                if (currentTotals.usdFisico > 0) usedCurrencies.push('usdFisico');
                if (currentTotals.usdTarjeta > 0) usedCurrencies.push('usdTarjeta');
                if (currentTotals.cop > 0) usedCurrencies.push('cop');
                if (currentTotals.ves > 0) usedCurrencies.push('ves');

                const newCurrencies = [];
                if (payment.usdFisico > 0) newCurrencies.push('usdFisico');
                if (payment.usdTarjeta > 0) newCurrencies.push('usdTarjeta');
                if (payment.cop > 0) newCurrencies.push('cop');
                if (payment.ves > 0) newCurrencies.push('ves');

                for (const currency of newCurrencies) {
                    if (usedCurrencies.length > 0 && !usedCurrencies.includes(currency)) {
                        throw new BadRequestException(`Las ventas fraccionadas solo pueden pagarse en las monedas iniciales (${usedCurrencies.join(', ')}). Ha intentado pagar con ${currency}.`);
                    }
                }
            }

            const updatedTotals = {
                usdFisico: currentTotals.usdFisico + payment.usdFisico,
                usdTarjeta: currentTotals.usdTarjeta + payment.usdTarjeta,
                cop: currentTotals.cop + payment.cop,
                ves: currentTotals.ves + payment.ves,
            };

            const updatedSale = await tx.sale.update({
                where: { id },
                data: {
                    receivedTotals: updatedTotals,
                    status: isFullyPaid ? 'pagado' : sale.status,
                },
                include: { items: true },
            });

            return updatedSale;
        });
    }

    async getProductsSummary(dateFrom?: string, dateTo?: string) {
        const where: Prisma.SaleWhereInput = {};

        if (dateFrom || dateTo) {
            where.date = {};
            if (dateFrom) {
                where.date.gte = new Date(dateFrom);
            }
            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setHours(23, 59, 59, 999);
                where.date.lte = endDate;
            }
        }

        const aggregations = await this.prisma.saleItem.groupBy({
            by: ['productId'],
            _sum: {
                quantity: true,
            },
            where: {
                sale: where,
            },
        });

        const productIds = aggregations.map(agg => agg.productId);
        const products = await this.prisma.product.findMany({
            where: { 
                id: { in: productIds },
                deletedAt: null // Ignorar productos eliminados lógicamente
            },
            select: { id: true, name: true },
        });

        const productMap = new Map(products.map(p => [p.id, p.name]));

        const results = aggregations
            .filter(agg => productMap.has(agg.productId)) // Solo incluir productos que no estén eliminados
            .map(agg => ({
                productId: agg.productId,
                name: productMap.get(agg.productId)!,
                totalSold: agg._sum.quantity || 0,
            }));

        results.sort((a, b) => b.totalSold - a.totalSold);

        return results;
    }
}
