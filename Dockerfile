# syntax=docker/dockerfile:1

##################################
# 1. Build stage (compilation)  #
##################################
FROM oven/bun:1 AS build

WORKDIR /app

# Disable telemetry and ensure logs are visible
ENV DISABLE_TELEMETRY=true \
    POSTHOG_DISABLED=true \
    MASTRA_TELEMETRY_DISABLED=true \
    DO_NOT_TRACK=1 \
    NEXT_TELEMETRY_DISABLED=1 \
    PYTHONUNBUFFERED=1 \
    NODE_ENV=production

# Copy package files (maximize cache layer)
COPY package.json bun.lockb* ./

# Install dependencies with frozen lockfile
RUN bun install --frozen-lockfile

# Copy environment variables
COPY .env* ./

# Copy entire application
COPY . .

# Build the application
RUN bun run build

##################################
# 2. Runtime stage (execution)  #
##################################
FROM oven/bun:1 AS runtime

WORKDIR /app

# Create non-root user for security
RUN groupadd -g 1001 appgroup && \
    useradd -u 1001 -g appgroup -m -d /app -s /bin/false appuser

# Pre-create necessary directories with correct permissions
RUN mkdir -p /app/.config /app/.next && \
    chown -R appuser:appgroup /app/.config /app/.next

# Copy built application from build stage
COPY --from=build --chown=appuser:appgroup /app .

# Set production environment
ENV NODE_ENV=production \
    DISABLE_TELEMETRY=true \
    POSTHOG_DISABLED=true \
    MASTRA_TELEMETRY_DISABLED=true \
    DO_NOT_TRACK=1 \
    NEXT_TELEMETRY_DISABLED=1

# Switch to non-root user
USER appuser

# Expose ports
EXPOSE 3000  4111

# Health check (optional but recommended)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD bun run health || exit 1

# Start application
ENTRYPOINT ["bun", "run", "start"]