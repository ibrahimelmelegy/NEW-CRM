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

# 5. Reset admin password (one-time)
echo "[5/5] Resetting admin password..."
sleep 10
docker compose -f docker-compose.prod.yml exec -T backend node -e "
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
async function reset() {
  const s = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, { host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'postgres', logging: false });
  await s.authenticate();
  const hash = await bcrypt.hash('Heroo@1502', 12);
  const [results] = await s.query('UPDATE \"Users\" SET password = \$1 WHERE email = \$2 RETURNING id', { bind: [hash, 'admin@hp-tech.com'] });
  console.log('Password reset done, rows:', results.length);
  await s.query('DELETE FROM \"LoginFailures\" WHERE email = \$1', { bind: ['admin@hp-tech.com'] });
  console.log('Login failures cleared');
  await s.close();
}
reset().catch(e => console.error(e));
"

echo ""
echo "=== Container Status ==="
docker compose -f docker-compose.prod.yml ps
echo ""
echo "=== Redeploy Complete! ==="
