FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/ims/package.json ./apps/ims/
COPY packages/*/package.json ./packages/

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the IMS app
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build --workspace=@partpal/ims

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the built application
COPY --from=builder /app/apps/ims/.next/standalone ./
COPY --from=builder /app/apps/ims/.next/static ./apps/ims/.next/static
COPY --from=builder /app/apps/ims/public ./apps/ims/public

USER nextjs

EXPOSE 3001

ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

CMD ["node", "apps/ims/server.js"]