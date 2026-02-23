#!/bin/bash
# ============================================
# High Point Technology CRM - Deploy Script
# Run this ON the DigitalOcean droplet
# ============================================

set -e

APP_DIR="/opt/crm"
REPO_URL="https://github.com/ibrahimelmelegy/NEW-CRM.git"
DOMAIN="crm.hp-tech.com"

echo "=========================================="
echo "  HP-Tech CRM Deployment"
echo "=========================================="

# ---- 1. Install Docker if not present ----
if ! command -v docker &> /dev/null; then
    echo "[1/6] Installing Docker..."
    apt-get update -qq
    apt-get install -y -qq ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    echo "  Docker installed successfully."
else
    echo "[1/6] Docker already installed."
fi

# ---- 2. Clone or pull repo ----
if [ -d "$APP_DIR" ]; then
    echo "[2/6] Pulling latest code..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "[2/6] Cloning repository..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# ---- 3. Check .env.production exists ----
if [ ! -f "$APP_DIR/.env.production" ]; then
    echo "[3/6] ERROR: .env.production not found!"
    echo "  Copy .env.production to $APP_DIR/.env.production and re-run."
    exit 1
else
    echo "[3/6] .env.production found."
fi

# ---- 4. Create SSL directory ----
echo "[4/6] Preparing SSL directories..."
mkdir -p "$APP_DIR/nginx/ssl" "$APP_DIR/nginx/certbot"

# ---- 5. Build and start containers ----
echo "[5/6] Building and starting containers..."
cd "$APP_DIR"
docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# ---- 6. Wait for services and seed ----
echo "[6/6] Waiting for database to be ready..."
sleep 10

# Run database seed (creates admin user and initial data)
echo "  Running database seed..."
docker compose -f docker-compose.prod.yml exec -T backend node dist/seed.js || echo "  Seed skipped (may already exist)."

echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
echo "  URL:     http://$DOMAIN"
echo "  IP:      http://157.245.223.119"
echo "  Status:  docker compose -f docker-compose.prod.yml ps"
echo "  Logs:    docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo "  Next: Set up SSL with:"
echo "    apt install certbot"
echo "    certbot certonly --webroot -w $APP_DIR/nginx/certbot -d $DOMAIN"
echo "    Then copy certs to $APP_DIR/nginx/ssl/ and uncomment HTTPS in nginx.conf"
echo ""
