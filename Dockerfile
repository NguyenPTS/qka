# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Cài đặt dependencies
COPY package*.json ./
RUN npm cache clean --force && \
    npm install --legacy-peer-deps --force && \
    npm install

# Copy source code
COPY . .

# Build ứng dụng
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Copy các file cần thiết từ builder
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose port
EXPOSE 3000

# Khởi chạy ứng dụng
CMD ["node", "server.js"] 