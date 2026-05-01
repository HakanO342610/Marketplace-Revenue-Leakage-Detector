# syntax=docker/dockerfile:1
# ---- Build stage ----
FROM node:24-alpine AS builder

WORKDIR /app

# Install deps with full devDependencies (needed for nest build + prisma)
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY tsconfig*.json nest-cli.json ./
COPY src ./src

# Generate Prisma client and compile TypeScript
RUN npx prisma generate
RUN npm run build

# Prune dev dependencies to slim runtime
RUN npm prune --omit=dev

# ---- Runtime stage ----
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3101

# Copy artifacts only
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

EXPOSE 3101

# Run pending migrations on startup, then boot the API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
