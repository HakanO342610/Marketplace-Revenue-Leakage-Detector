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

# ⚠️ CRITICAL — DO NOT REMOVE.
# Next.js evaluates `rewrites()` at BUILD time and serializes the
# destinations into routes-manifest.json. Runtime env is NOT honored.
# Without this ARG, the frontend container hard-codes localhost:3101
# into the manifest and every /api/* request returns ECONNREFUSED 500.
# See next.config.ts header for full explanation.
ARG BACKEND_INTERNAL_URL=http://backend:3101
ENV BACKEND_INTERNAL_URL=$BACKEND_INTERNAL_URL

# Hard-fail the build if anyone passes an empty value.
RUN test -n "$BACKEND_INTERNAL_URL" || (echo "ERROR: BACKEND_INTERNAL_URL build arg is empty. Pass --build-arg BACKEND_INTERNAL_URL=http://backend:3101" && exit 1)

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
