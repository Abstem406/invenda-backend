#!/bin/bash
# setup-prod.sh - Initial setup script for production

echo "================================================="
echo "          Starting Production Setup              "
echo "================================================="

echo "Checking base dependencies installation..."
# 1. Install all dependencies (devDependencies needed for build)
echo "[1/5] Installing dependencies with pnpm..."
pnpm install
pnpm approve-builds
# 2. Generate Prisma client adapted to this machine
echo "[2/5] Generating Prisma client..."
pnpm prisma generate

# 3. Build the NestJS project
echo "[3/5] Building the application..."
pnpm run build

# 4. Migrate schema to DB and run Seed (initial data)
echo "[4/5] Migrating and seeding the database..."
# migrate deploy ensures the table structure is created
npx prisma migrate deploy
# seed inserts default users (Admin, Cajero) and products
npx prisma db seed

# 5. Configure auto-start with PM2
echo "[5/5] Configuring the PM2 process manager..."

# Remove previous processes if they exist
pm2 delete invenda-backend 2> /dev/null || true

# Start process and tell PM2 to use the production script
echo "Starting the application with PM2..."
pm2 start npm --name "invenda-backend" -- run start:prod

# Save the active instance so PM2 knows what to start on PC boot
pm2 save

echo "================================================="
echo "Backend configuration completed successfully!"
echo ""
echo "The 'invenda-backend' process is now active in the background."
echo "-------------------------------------------------"
echo "IMPORTANT: For PM2 to start automatically with the PC,"
echo "run the command:  'pm2 startup'  and copy/paste the command it provides."
echo "================================================="
