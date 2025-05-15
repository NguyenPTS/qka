# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies with caching
COPY package*.json ./
RUN apk add --no-cache libc6-compat && \
    npm config set cache /tmp/npm-cache && \
    npm cache clean --force && \
    npm ci --only=production --legacy-peer-deps && \
    npm cache clean --force

# Copy source code
COPY . .

# Build application
ENV NODE_ENV=production
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary files from builder
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Add non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "server.js"] 