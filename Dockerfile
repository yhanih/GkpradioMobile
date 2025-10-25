# Multi-stage build for GKP Radio Application
FROM node:20-bullseye-slim as builder

# Install required system packages
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY components.json ./
COPY drizzle.config.ts ./

# Install dependencies
RUN npm ci

# Copy source code
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/

# Build the application
RUN npm run build

# Production stage
FROM node:20-bullseye-slim as production

# Install system dependencies for production
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create app user
RUN groupadd -r app && useradd -r -g app app

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist/
COPY --from=builder /app/dist/public ./public/

# Copy necessary configuration files and shared directory
COPY drizzle.config.ts ./
COPY shared/ ./shared/

# Set proper ownership
RUN chown -R app:app /app

# Create necessary directories with proper permissions
RUN mkdir -p /app/hls /app/media /app/logs && \
    chown -R app:app /app

# Switch to app user
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/api/stream/status || exit 1

# Expose ports
EXPOSE 5000 1935 8000 8889 9997

# Start the application
CMD ["npm", "start"]