import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Empezando a poblar la base de datos (seeding)...');

    // Limpiar datos existentes (opcional pero recomendado para desarrollo)
    await prisma.saleItem.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.exchangeRates.deleteMany();

    // 1. Crear Exchange Rates Iniciales
    await prisma.exchangeRates.create({
        data: {
            id: 'singleton',
            cop: 5,
            bcv: 435,
            copUsd: 3754,
        },
    });
    console.log('✅ Exchange Rates creados');

    // 2. Crear Categorías
    const snacksCategory = await prisma.category.create({
        data: { name: 'Snacks' },
    });
    const drinksCategory = await prisma.category.create({
        data: { name: 'Bebidas' },
    });
    console.log('✅ Categorías creadas');

    // 3. Crear Productos de Prueba
    await prisma.product.createMany({
        data: [
            {
                name: 'Doritos Queso 150g',
                status: 1, // 1 = Activo
                categoryId: snacksCategory.id,
                stock: 50,
                prices: {
                    usdTarjeta: 1.5,
                    usdFisico: 1.2,
                    cop: 6000,
                    ves: 65.25,
                    exchangeType: 'usd',
                },
            },
            {
                name: 'Coca-Cola 2L',
                status: 1,
                categoryId: drinksCategory.id,
                stock: 30,
                prices: {
                    usdTarjeta: 2.0,
                    usdFisico: 1.8,
                    cop: 7500,
                    ves: 87.0,
                    exchangeType: 'usd',
                },
            },
            {
                name: 'Chocolate Savory',
                status: 2, // 2 = Inactivo
                categoryId: snacksCategory.id,
                stock: 0,
                prices: {
                    usdTarjeta: 0.8,
                    usdFisico: 0.7,
                    cop: 3000,
                    ves: 34.8,
                    exchangeType: 'cop',
                },
            },
        ],
    });
    console.log('✅ Productos creados');

    console.log('🎉 Seeding completado exitosamente.');
}

main()
    .catch((e) => {
        console.error('Error durante el seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
