#!/bin/bash
# MRLD daily Postgres backup — install at /etc/cron.daily/mrld-backup
# Mirrors Xpensio's backup pattern: pg_dump | gzip + 7-day retention.

set -euo pipefail

BACKUP_DIR="/root/mrld-backups"
DB_CONTAINER="mrld_db"
DB_NAME="mrld"
DB_USER="mrld"
KEEP_DAYS=7
DATE=$(date +%Y-%m-%d_%H-%M)

mkdir -p "$BACKUP_DIR"

if docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" \
   | gzip > "$BACKUP_DIR/mrld_${DATE}.sql.gz"; then
    echo "[$(date)] Backup OK: mrld_${DATE}.sql.gz ($(du -h "$BACKUP_DIR/mrld_${DATE}.sql.gz" | cut -f1))"
else
    echo "[$(date)] HATA: Backup başarısız!" >&2
    exit 1
fi

# Eski backupları temizle
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +${KEEP_DAYS} -delete
echo "[$(date)] Eski backuplar temizlendi (>${KEEP_DAYS} gün)"

# Toplam yer kullanımı
du -sh "$BACKUP_DIR"
