# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /usr/src/app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps --omit=dev

# Copy compiled output
COPY --from=builder /usr/src/app/dist ./dist

# Create uploads directory
RUN mkdir -p public/uploads

EXPOSE 5000

CMD ["node", "dist/server.js"]
