# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies with caching
COPY package*.json ./
RUN apk add --no-cache libc6-compat && \
    npm install -D autoprefixer@10.4.16 postcss@8.4.32 tailwindcss@3.4.0 && \
    npm install

# Copy source code
COPY . .

# Create default env file if not exists
RUN if [ ! -f .env.production ]; then \
    echo "MONGODB_URI=mongodb://pharmatech:pharmatech_dev_76@103.72.96.222:27017/faq_multivit?authSource=admin" > .env.production && \
    echo "NODE_ENV=production" >> .env.production && \
    echo "NEXT_PUBLIC_API_URL=https://faq.trungthanhdev.com" >> .env.production; \
    fi

# Copy env file
RUN cp .env.production .env.local || echo "No .env.production file found, using defaults"

# Build application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/components ./components
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/models ./models
COPY --from=builder /app/types ./types
COPY --from=builder /app/postcss.config.js ./
COPY --from=builder /app/tailwind.config.js ./
COPY --from=builder /app/app/globals.css ./app/
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.env.local ./.env.local

# Install production dependencies only
RUN npm install --production

# Set correct permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Add MongoDB healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start application with proper environment
CMD ["npm", "start"] 