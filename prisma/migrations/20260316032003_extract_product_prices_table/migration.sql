/*
  Warnings:

  - You are about to drop the column `prices` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "prices";

-- CreateTable
CREATE TABLE "product_prices" (
    "id" TEXT NOT NULL,
    "usdTarjeta" DOUBLE PRECISION NOT NULL,
    "usdFisico" DOUBLE PRECISION NOT NULL,
    "cop" DOUBLE PRECISION NOT NULL,
    "ves" DOUBLE PRECISION NOT NULL,
    "exchangeType" TEXT NOT NULL,
    "isCustomVes" BOOLEAN NOT NULL DEFAULT false,
    "productId" TEXT NOT NULL,

    CONSTRAINT "product_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_prices_productId_key" ON "product_prices"("productId");

-- AddForeignKey
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
