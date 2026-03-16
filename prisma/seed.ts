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

    const cajero = await prisma.user.upsert({
        where: { email: 'cajero@invenda.com' },
        update: { role: 'CAJERO' },
        create: { email: 'cajero@invenda.com', name: 'Cajero', password: hashedPassword, role: 'CAJERO', mustChangePassword: false },
    });

    // ── Exchange Rates ────────────────────────────────────
    await prisma.exchangeRates.upsert({
        where: { id: 'singleton' },
        update: {},
        create: { id: 'singleton', cop: 4200, bcv: 78.50, copUsd: 0.000238 },
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
                prices: {
                    usdTarjeta: p.usd,
                    usdFisico: p.usd,
                    cop: Math.round(p.usd * cop),
                    ves: +(p.usd * bcv).toFixed(2),
                    exchangeType: 'usd',
                    isCustomVes: false,
                },
            },
        });
    }

    console.log('Seed completed:');
    console.log(`  Users:    Admin (${admin.email}) + Cajero (${cajero.email}) | Password: ${adminPassword}`);
    console.log(`  Categories: ${categoriesData.length}`);
    console.log(`  Products:   ${productsData.length}`);
    console.log(`  Exchange Rates: COP=${cop} | BCV=${bcv}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
