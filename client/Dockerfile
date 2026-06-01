# Stage 1: Build React/Vite App
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package descriptors & install
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
# Accept VITE variables during Docker Build process
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Serve via NGINX (Ultra-lightweight static proxy)
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy Vite build output to NGINX serving directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 (Vercel/Render will map this externally)
EXPOSE 80

# Nginx needs to stay in the foreground
CMD ["nginx", "-g", "daemon off;"]
