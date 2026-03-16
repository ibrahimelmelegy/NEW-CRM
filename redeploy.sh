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
git fetch origin main
git reset --hard origin/main

# 2. Build containers
echo "[2/4] Building containers..."
docker compose -f docker-compose.prod.yml build

# 3. Restart containers
echo "[3/4] Starting containers..."
docker compose -f docker-compose.prod.yml up -d

# 4. Setup Power BI read-only user (safe to run multiple times)
echo "[4/5] Setting up Power BI database user..."
sleep 5
docker compose -f docker-compose.prod.yml exec -T db psql \
  -U "${POSTGRES_USER:-leadify}" \
  -d "${POSTGRES_DB:-leadify}" \
  -f /docker-entrypoint-initdb.d/99-powerbi-user.sql 2>/dev/null || \
docker compose -f docker-compose.prod.yml exec -T db psql \
  -U "${POSTGRES_USER:-leadify}" \
  -d "${POSTGRES_DB:-leadify}" \
  -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='powerbi_user') THEN CREATE USER powerbi_user WITH PASSWORD 'moac39bKyhZ5m2rkqqrh'; END IF; END \$\$; GRANT CONNECT ON DATABASE ${POSTGRES_DB:-leadify} TO powerbi_user; GRANT USAGE ON SCHEMA public TO powerbi_user; GRANT SELECT ON ALL TABLES IN SCHEMA public TO powerbi_user; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO powerbi_user;" \
  2>/dev/null || echo "Power BI user setup skipped (will retry on next deploy)"

# 5. Clean up old images
echo "[5/5] Cleaning up old images..."
docker image prune -f

echo ""
echo "=== Container Status ==="
docker compose -f docker-compose.prod.yml ps
echo ""
echo "=== Redeploy Complete! ==="
echo ""
echo "=== Power BI Connection Info ==="
echo "  Server:   157.245.223.119"
echo "  Port:     5432"
echo "  Database: ${POSTGRES_DB:-leadify}"
echo "  Username: powerbi_user"
echo "  Password: moac39bKyhZ5m2rkqqrh"
