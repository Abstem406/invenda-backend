-- AlterTable
ALTER TABLE "product_prices" ADD COLUMN     "isCustomCop" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isCustomUsdFisico" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isCustomUsdTarjeta" BOOLEAN NOT NULL DEFAULT false;
