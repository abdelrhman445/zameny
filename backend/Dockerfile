# ═══════════════════════════════════════════════════════════════════════════════
#   A.E.E - Advanced E-commerce Engine  |  Production Dockerfile
#   Multi-stage build for minimal, secure, production-ready image
# ═══════════════════════════════════════════════════════════════════════════════

# ── Stage 1: Dependency installer ───────────────────────────────────────────
FROM node:20-alpine AS deps

# Install OS-level build tools needed by some native npm packages
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files first (layer-caching: only re-runs npm ci if package*.json changes)
COPY package.json package-lock.json* ./

# Install ONLY production dependencies
# --frozen-lockfile ensures reproducible builds
RUN npm ci --only=production --frozen-lockfile && \
    # Clean npm cache to reduce layer size
    npm cache clean --force


# ── Stage 2: Production runner ───────────────────────────────────────────────
FROM node:20-alpine AS runner

# Security: don't run as root
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nodeuser

WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps --chown=nodeuser:nodejs /app/node_modules ./node_modules

# Copy application source
COPY --chown=nodeuser:nodejs . .

# Remove dev/config files not needed at runtime
RUN rm -rf \
    .env.example \
    .github \
    .eslintrc* \
    *.md \
    ecosystem.config.js

# ── Security hardening ────────────────────────────────────────────────────────
# Read-only filesystem: prevents writes to container layer
# Secrets should be injected via environment variables or mounted secrets

# Expose the application port (default 5000)
EXPOSE 5000

# Health check — Docker/orchestrator will mark the container unhealthy if this fails
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-5000}/health || exit 1

# ── Runtime user ──────────────────────────────────────────────────────────────
USER nodeuser

# ── Environment ───────────────────────────────────────────────────────────────
ENV NODE_ENV=production \
    PORT=5000

# PM2 is installed globally in the image for cluster mode
# Alternatively, use `node server.js` for single-process deployments
# For PM2: install pm2 in deps stage and update CMD
CMD ["node", "server.js"]
