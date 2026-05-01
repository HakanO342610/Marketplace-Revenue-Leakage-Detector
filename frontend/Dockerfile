# syntax=docker/dockerfile:1
# ---- Deps stage ----
FROM node:24-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ---- Build stage ----
FROM node:24-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Bake the backend URL into the rewrite manifest at build time.
# Next.js rewrites() are evaluated once during `next build` and
# serialized into routes-manifest.json — runtime env is too late.
ARG BACKEND_INTERNAL_URL=http://backend:3101
ENV BACKEND_INTERNAL_URL=$BACKEND_INTERNAL_URL

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# next.config.ts has output: 'standalone' — produces .next/standalone
RUN npm run build

# ---- Runtime stage ----
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
