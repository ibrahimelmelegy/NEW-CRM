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

ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run generate

# Stage 2: Serve with Nginx
FROM nginx:1.27-alpine

# Remove default nginx page, copy generated SPA
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/.output/public /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create directory for SSL certs and certbot
RUN mkdir -p /etc/nginx/ssl /var/www/certbot

# Run as non-root user for security
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/ssl /var/www/certbot && \
    touch /var/run/nginx.pid && chown nginx:nginx /var/run/nginx.pid
USER nginx

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
