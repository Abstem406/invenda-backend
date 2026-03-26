-- Safe two-step migration: Add userId to sales table
-- Works on both existing databases (with data) and fresh installations

-- Step 1: Add column as nullable first
ALTER TABLE "sales" ADD COLUMN "userId" TEXT;

-- Step 2: Assign existing sales to the default admin user (no-op on fresh installs)
UPDATE "sales" SET "userId" = (SELECT "id" FROM "users" WHERE "email" = 'admin@invenda.com' LIMIT 1) WHERE "userId" IS NULL;

-- Step 3: Make the column required
ALTER TABLE "sales" ALTER COLUMN "userId" SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE "sales" ADD CONSTRAINT "sales_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
