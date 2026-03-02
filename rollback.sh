#!/bin/bash
set -euo pipefail

# HP Tech CRM - Production Rollback Script
# Usage: ./rollback.sh [commits_back]
# Default: rolls back 1 commit

COMMITS_BACK=${1:-1}
DEPLOY_DIR=${DEPLOY_DIR:-/opt/crm}
HEALTH_URL=${HEALTH_URL:-https://crm.hp-tech.com/api/health}
TIMEOUT=15

echo "========================================="
echo "  HP Tech CRM - Rollback Script"
echo "========================================="
echo "Rolling back ${COMMITS_BACK} commit(s)..."
echo ""

cd "${DEPLOY_DIR}"

# Store current commit for logging
CURRENT_COMMIT=$(git rev-parse --short HEAD)
echo "[1/5] Current commit: ${CURRENT_COMMIT}"

# Stop running containers gracefully
echo "[2/5] Stopping containers..."
docker compose down --timeout 30

# Roll back git
echo "[3/5] Rolling back to HEAD~${COMMITS_BACK}..."
git checkout "HEAD~${COMMITS_BACK}"
TARGET_COMMIT=$(git rev-parse --short HEAD)
echo "       Target commit: ${TARGET_COMMIT}"

# Rebuild and start
echo "[4/5] Rebuilding containers..."
docker compose build --no-cache
docker compose up -d

# Health check with retries
echo "[5/5] Verifying deployment health..."
sleep "${TIMEOUT}"

HEALTHY=false
for i in $(seq 1 5); do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${HEALTH_URL}" 2>/dev/null || echo "000")
  if [ "${HTTP_STATUS}" = "200" ]; then
    HEALTHY=true
    break
  fi
  echo "       Attempt ${i}/5 - Status: ${HTTP_STATUS}, retrying in 10s..."
  sleep 10
done

if [ "${HEALTHY}" = true ]; then
  echo ""
  echo "========================================="
  echo "  Rollback SUCCESSFUL"
  echo "  From: ${CURRENT_COMMIT} -> To: ${TARGET_COMMIT}"
  echo "========================================="

  # Clean up unused images
  docker image prune -f 2>/dev/null || true
  exit 0
else
  echo ""
  echo "========================================="
  echo "  Rollback FAILED - Health check failed"
  echo "  Manual intervention required!"
  echo "========================================="
  exit 1
fi
