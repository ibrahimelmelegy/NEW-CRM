#!/bin/bash
# ============================================
# HP-Tech CRM - PostgreSQL Backup Script
# Runs daily via cron, keeps 30 days of backups
# Lives at /opt/crm/backup-db.sh on server
# ============================================

set -e

BACKUP_DIR="/opt/crm/backups"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/leadify_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting database backup..."

# Dump database from Docker container, compress
docker compose -f /opt/crm/docker-compose.prod.yml exec -T db \
  pg_dump -U leadify -d leadify --no-owner --clean | gzip > "$BACKUP_FILE"

# Verify backup is not empty
if [ ! -s "$BACKUP_FILE" ]; then
  echo "[$(date)] ERROR: Backup file is empty!" >&2
  rm -f "$BACKUP_FILE"
  exit 1
fi

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup created: $BACKUP_FILE ($SIZE)"

# Remove backups older than retention period
DELETED=$(find "$BACKUP_DIR" -name "leadify_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
echo "[$(date)] Cleaned up $DELETED old backups"

echo "[$(date)] Backup complete"
