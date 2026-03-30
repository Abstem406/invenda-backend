FROM node:22-bookworm-slim AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies required by Prisma
RUN apt-get update -y && apt-get install -y openssl

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile
RUN pnpm dlx prisma generate

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Copy prisma schema in case migrations are needed (optional, but good practice)
COPY --from=builder /app/prisma ./prisma

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nestjs
USER nestjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "dist/src/main"]
