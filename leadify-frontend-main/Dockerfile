# Stage 1: Build the Nuxt SPA
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build
COPY . .

ARG API_BASE_URL=/api/
ARG BASE_URL=https://crm.hp-tech.com/
ENV API_BASE_URL=$API_BASE_URL
ENV BASE_URL=$BASE_URL

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.27-alpine

# Copy built SPA files
COPY --from=builder /app/.output/public /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create directory for SSL certs and certbot
RUN mkdir -p /etc/nginx/ssl /var/www/certbot

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
