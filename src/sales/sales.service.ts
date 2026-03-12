import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.sale.findMany({
            include: {
                items: true,
            },
        });
    }

    async create(createSaleDto: CreateSaleDto) {
        return this.prisma.$transaction(async (tx) => {
            // 1. Process each item and deduct stock
            for (const item of createSaleDto.items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                });

                if (!product) {
                    throw new BadRequestException(`El producto con ID ${item.productId} no existe.`);
                }

                if (product.stock < item.quantity) {
                    throw new BadRequestException(`Sin stock suficiente para el producto: ${product.name}`);
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
