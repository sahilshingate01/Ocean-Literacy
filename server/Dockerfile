# syntax=docker/dockerfile:1
# Multi-stage production container for Ocean Literacy Phase 2 Backend
# Least-privilege execution using unprivileged 'node' user

# --- STAGE 1: Build & Dependencies ---
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install native compilation dependencies for bcrypt / crypto if needed
RUN apk add --no-cache python3 make g++

# Copy package descriptors
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies including devDependencies for prisma client generation
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy application source code
COPY . .

# Prune devDependencies to reduce image attack surface
RUN npm prune --production

# --- STAGE 2: Production Runtime ---
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Set production environment defaults
ENV NODE_ENV=production
ENV PORT=3000

# Install curl for Docker health checks
RUN apk add --no-cache curl

# Copy runtime node_modules and built Prisma engine from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/src ./src

# Create unprivileged application home and transfer ownership
USER node

# Expose HTTP API port
EXPOSE 3000

# Docker native container health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health/liveness || exit 1

# Launch application
CMD ["node", "src/server.js"]
