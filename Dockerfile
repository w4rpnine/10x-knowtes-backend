ARG NODE_VERSION=22
# ---- Base ----
# Base stage with Node.js for build steps
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ---- Dependencies ----
# Install dependencies in a separate layer to leverage Docker cache
FROM base AS deps
COPY package.json package-lock.json* .nvmrc ./
RUN \
  if [ -f .nvmrc ]; then \
    NVMRC_NODE_VERSION=$(cat .nvmrc); \
    echo "Using Node version from .nvmrc: $NVMRC_NODE_VERSION"; \
    # Add logic here if you need to enforce the .nvmrc version strictly \
    # For now, we rely on the ARG NODE_VERSION matching \
  fi; \
  npm ci

# ---- Build ----
# Build the application using the installed dependencies
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Release ----
# Final, minimal image with only the standalone build output
FROM node:${NODE_VERSION}-alpine AS release
WORKDIR /app

# Create a non-root user and group
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

# Copy build output and dependencies
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /app/package.json ./package.json

# Set default HOST, allowing override via environment variables
ENV HOST=0.0.0.0

EXPOSE 3000

# Command to run the standalone server
CMD ["node", "dist/server/entry.mjs"] 