# ================================
# Stage 1: Build Stage
# ================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma/ ./prisma/

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY src/ ./src/

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ================================
# Stage 2: Production Stage
# ================================
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./
COPY prisma/ ./prisma/

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Generate Prisma Client
RUN npx prisma generate

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist/ ./dist/

# Create logs directory
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/server.js"]
