import { PrismaClient } from '../generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    // ── Users ──────────────────────────────────────────────
    const adminPassword = 'password123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@invenda.com' },
        update: { role: 'ADMIN' },
        create: { email: 'admin@invenda.com', name: 'Admin', password: hashedPassword, role: 'ADMIN', mustChangePassword: false },
    });

    // ── Exchange Rates ────────────────────────────────────
    await prisma.exchangeRates.upsert({
        where: { id: 'singleton' },
        update: {},
        create: { id: 'singleton', cop: 4200, bcv: 78.50, copUsd: 4000 },
    });

    if (process.env.NODE_ENV !== 'production') {
        const cajero = await prisma.user.upsert({
            where: { email: 'cajero@invenda.com' },
            update: { role: 'CAJERO' },
            create: { email: 'cajero@invenda.com', name: 'Cajero', password: hashedPassword, role: 'CAJERO', mustChangePassword: false },
        });

        // ── Categories ────────────────────────────────────────
        const categoriesData = [
            { name: 'Bebidas' },
            { name: 'Snacks' },
            { name: 'Lácteos' },
            { name: 'Limpieza' },
            { name: 'Cuidado Personal' },
        ];

        const categories: Record<string, string> = {};
        for (const cat of categoriesData) {
            const created = await prisma.category.create({ data: cat });
            categories[cat.name] = created.id;
        }

        // ── Products (15 items) ───────────────────────────────
        const productsData = [
            { name: 'Coca-Cola 500ml', category: 'Bebidas', stock: 48, usd: 1.50 },
            { name: 'Pepsi 500ml', category: 'Bebidas', stock: 36, usd: 1.40 },
            { name: 'Agua Mineral 1L', category: 'Bebidas', stock: 60, usd: 0.80 },
            { name: 'Jugo de Naranja 1L', category: 'Bebidas', stock: 24, usd: 2.50 },
            { name: 'Doritos 150g', category: 'Snacks', stock: 30, usd: 2.00 },
            { name: 'Oreo 120g', category: 'Snacks', stock: 25, usd: 1.80 },
            { name: 'Ruffles 130g', category: 'Snacks', stock: 20, usd: 2.10 },
            { name: 'Leche Entera 1L', category: 'Lácteos', stock: 40, usd: 1.20 },
            { name: 'Yogurt Natural 500g', category: 'Lácteos', stock: 18, usd: 1.50 },
            { name: 'Queso Blanco 500g', category: 'Lácteos', stock: 12, usd: 3.50 },
            { name: 'Detergente Líquido 1L', category: 'Limpieza', stock: 15, usd: 4.00 },
            { name: 'Jabón en Barra x3', category: 'Limpieza', stock: 22, usd: 2.50 },
            { name: 'Cloro 1L', category: 'Limpieza', stock: 30, usd: 1.00 },
            { name: 'Shampoo 400ml', category: 'Cuidado Personal', stock: 16, usd: 3.80 },
            { name: 'Pasta Dental 100ml', category: 'Cuidado Personal', stock: 28, usd: 2.20 },
        ];

        const cop = 4200;
        const bcv = 78.50;

        for (const p of productsData) {
            await prisma.product.create({
                data: {
                    name: p.name,
                    status: 1,
                    categoryId: categories[p.category],
                    stock: p.stock,
                    price: {
                        create: {
                            usdTarjeta: p.usd,
                            usdFisico: p.usd,
                            cop: Math.round(p.usd * cop),
                            ves: +(p.usd * bcv).toFixed(2),
                            exchangeType: 'usd',
                            isCustomVes: false,
                        },
                    },
                },
            });
        }

        // ── Mock Sales (Development only) ─────────────────────
        await seedMockSales();

        console.log('Seed completed (Development Mode):');
        console.log(`  Users:    Admin (${admin.email}) + Cajero (${cajero.email}) | Password: ${adminPassword}`);
        console.log(`  Categories: ${categoriesData.length}`);
        console.log(`  Products:   ${productsData.length}`);
        console.log(`  Exchange Rates: COP=${cop} | BCV=${bcv}`);
    } else {
        // En Producción no creamos ni mock sales, ni categorías falsas ni productos
        console.log('Seed completed (Production Mode):');
        console.log(`  Users:    Admin (${admin.email}) | Password: ${adminPassword}`);
        console.log(`  Exchange Rates: Created singleton rates`);
    }
}

async function seedMockSales() {
    console.log('Seeding mock sales for the last 15 days...');
    const products = await prisma.product.findMany({ include: { price: true } });
    if (products.length === 0) return;

    const today = new Date();

    // Create sales for the last 15 days
    for (let i = 0; i < 15; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Randomly generate between 2 to 5 sales per day
        const salesCount = Math.floor(Math.random() * 4) + 2;

        for (let j = 0; j < salesCount; j++) {
            const saleDate = new Date(date);
            // Random time between 8:00 AM and 5:59 PM
            saleDate.setHours(Math.floor(Math.random() * 10) + 8);
            saleDate.setMinutes(Math.floor(Math.random() * 60));

            // Select 1 to 3 random products for the sale
            const itemsCount = Math.floor(Math.random() * 3) + 1;
            const shuffled = [...products].sort(() => 0.5 - Math.random());
            const selectedProducts = shuffled.slice(0, itemsCount);

            let totalUsdFisico = 0;
            const itemsData = selectedProducts.map(p => {
                const quantity = Math.floor(Math.random() * 3) + 1;
                const unitPrice = {
                    usdTarjeta: p.price?.usdTarjeta || 0,
                    usdFisico: p.price?.usdFisico || 0,
                    cop: p.price?.cop || 0,
                    ves: p.price?.ves || 0,
                };
                const totalPrice = {
                    usdTarjeta: +(unitPrice.usdTarjeta * quantity).toFixed(2),
                    usdFisico: +(unitPrice.usdFisico * quantity).toFixed(2),
                    cop: +(unitPrice.cop * quantity).toFixed(2),
                    ves: +(unitPrice.ves * quantity).toFixed(2),
                };

                totalUsdFisico += totalPrice.usdFisico;

                return {
                    productId: p.id,
                    quantity,
                    unitPrice,
                    totalPrice,
                    payments: { usdFisico: totalPrice.usdFisico, usdTarjeta: 0, cop: 0, ves: 0 },
                };
            });

            await prisma.sale.create({
                data: {
                    date: saleDate,
                    status: 'pagado',
                    receivedTotals: { usdFisico: +(totalUsdFisico).toFixed(2), usdTarjeta: 0, cop: 0, ves: 0 },
                    items: {
                        create: itemsData,
                    },
                },
            });
        }
    }
    console.log('Mock sales inserted successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
