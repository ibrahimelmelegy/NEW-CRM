#!/bin/bash
# ============================================
# Deploy to Staging - Run from local machine
# Usage: bash deploy-staging.sh
# ============================================

set -e

echo "=== HP-Tech CRM - Deploy to Staging ==="
echo ""

# 1. Push latest code to GitHub
echo "[1/3] Pushing to GitHub..."
cd "$(dirname "$0")"
git push origin main

# 2. SSH into server and pull + rebuild
echo "[2/3] Deploying on server..."
ssh root@157.245.223.119 '/opt/crm/redeploy.sh'

# 3. Verify
echo ""
echo "[3/3] Verifying..."
curl -sk -o /dev/null -w "HTTPS: %{http_code}\n" https://crm.hp-tech.com

echo ""
echo "=== Done! https://crm.hp-tech.com ==="
