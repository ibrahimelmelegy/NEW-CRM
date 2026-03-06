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
sleep 15
docker compose -f docker-compose.prod.yml exec -T backend node -e "
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
async function reset() {
  try {
    const s = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, { host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'postgres', logging: false });
    await s.authenticate();
    console.log('DB connected');
    // List all tables
    const [tables] = await s.query(\"SELECT tablename FROM pg_tables WHERE schemaname='public'\");
    console.log('Tables:', tables.map(t => t.tablename).join(', '));
    // Count users
    const [countResult] = await s.query('SELECT COUNT(*) as cnt FROM \"Users\"');
    console.log('User count:', countResult[0].cnt);
    // List all users
    const [users] = await s.query('SELECT id, email, name FROM \"Users\" ORDER BY id LIMIT 10');
    console.log('Users:', JSON.stringify(users));
    // If no users exist, create admin
    if (users.length === 0) {
      console.log('No users found! Creating admin user...');
      const hash = await bcrypt.hash('Heroo@1502', 12);
      // Find or create SUPER_ADMIN role
      const [roles] = await s.query(\"SELECT id FROM \\\"Roles\\\" WHERE name='SUPER_ADMIN' LIMIT 1\");
      let roleId;
      if (roles.length > 0) { roleId = roles[0].id; } else {
        const [newRole] = await s.query(\"INSERT INTO \\\"Roles\\\" (id, name, description, permissions, \\\"createdAt\\\", \\\"updatedAt\\\") VALUES (gen_random_uuid(), 'SUPER_ADMIN', 'System Admin', '[]', NOW(), NOW()) RETURNING id\");
        roleId = newRole[0].id;
      }
      await s.query('INSERT INTO \"Users\" (name, email, password, \"roleId\", status, \"createdAt\", \"updatedAt\") VALUES (\$1, \$2, \$3, \$4, \$5, NOW(), NOW())', { bind: ['System Admin', 'admin@hp-tech.com', hash, roleId, 'ACTIVE'] });
      console.log('Admin user created: admin@hp-tech.com');
    } else {
      // Reset first user password
      const hash = await bcrypt.hash('Heroo@1502', 12);
      await s.query('UPDATE \"Users\" SET password = \$1 WHERE id = \$2', { bind: [hash, users[0].id] });
      console.log('Password reset for:', users[0].email);
    }
    // Clear login failures
    try { await s.query('DELETE FROM \"LoginFailures\"'); } catch(e) {}
    console.log('Login failures cleared');
    await s.close();
  } catch(err) { console.error('RESET ERROR:', err.message); }
}
reset();
"

echo ""
echo "=== Container Status ==="
docker compose -f docker-compose.prod.yml ps
echo ""
echo "=== Redeploy Complete! ==="
