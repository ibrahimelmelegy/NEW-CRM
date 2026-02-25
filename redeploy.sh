#!/bin/bash
# ============================================
# HP-Tech CRM - Redeploy Script
# Run ON the DigitalOcean droplet
# Pulls latest code and rebuilds containers
# ============================================

set -e

APP_DIR="/opt/crm"

echo "=== HP-Tech CRM - Redeploying ==="
echo ""

# 1. Pull latest code
echo "[1/4] Pulling latest code..."
cd "$APP_DIR"
git pull origin main

# 2. Build containers
echo "[2/4] Building containers..."
docker compose -f docker-compose.prod.yml build

# 3. Restart containers
echo "[3/4] Starting containers..."
docker compose -f docker-compose.prod.yml up -d

# 4. Clean up old images
echo "[4/4] Cleaning up old images..."
docker image prune -f

echo ""
echo "=== Container Status ==="
docker compose -f docker-compose.prod.yml ps
echo ""
echo "=== Redeploy Complete! ==="
