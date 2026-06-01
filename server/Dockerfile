# Stage 1: Builder
# Installs all deps (including devDeps if needed for native modules)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Use ci for reliable builds
RUN npm ci
COPY . .

# Stage 2: Production
# Drops all caching, devDependencies, and OS build tools
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copy only necessary source assets from builder (Explicitly ignores tests, docs, scripts)
COPY --from=builder /app/src ./src
COPY --from=builder /app/server.js ./server.js
# Optional: copy config/uploads if they exist
# COPY --from=builder /app/config ./config

EXPOSE 5000

CMD ["npm", "start"]
