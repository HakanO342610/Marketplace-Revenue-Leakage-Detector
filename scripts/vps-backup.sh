#!/bin/bash
# MRLD daily Postgres backup — install at /etc/cron.daily/mrld-backup
# Mirrors Xpensio's pattern + Telegram notifications on success/failure.

set -uo pipefail

BACKUP_DIR="/root/mrld-backups"
DB_CONTAINER="mrld_db"
DB_NAME="mrld"
DB_USER="mrld"
KEEP_DAYS=7
DATE=$(date +%Y-%m-%d_%H-%M)

# Telegram (shared xpensio_alerts channel) — read from env or /opt/mrld/.env
if [ -f /opt/mrld/.env ]; then
  set -a
  # shellcheck disable=SC1091
  . /opt/mrld/.env
  set +a
fi

notify() {
  local emoji="$1"
  local title="$2"
  local body="$3"
  if [ -z "${TELEGRAM_BOT_TOKEN:-}" ] || [ -z "${TELEGRAM_CHAT_ID:-}" ]; then
    return 0
  fi
  curl -s -o /dev/null -X POST \
    "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=${emoji} <b>[MRLD] ${title}</b>%0A${body}" \
    --data-urlencode "parse_mode=HTML" || true
}

mkdir -p "$BACKUP_DIR"

if docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" \
   | gzip > "$BACKUP_DIR/mrld_${DATE}.sql.gz"; then
    SIZE=$(du -h "$BACKUP_DIR/mrld_${DATE}.sql.gz" | cut -f1)
    echo "[$(date)] Backup OK: mrld_${DATE}.sql.gz ($SIZE)"
    notify "✅" "Günlük backup başarılı" "mrld_${DATE}.sql.gz · ${SIZE}"
else
    echo "[$(date)] HATA: Backup başarısız!" >&2
    notify "🔴" "Günlük backup BAŞARISIZ" "Tarih: ${DATE}%0AHost'ta logu kontrol et: <code>journalctl -u cron</code>"
    exit 1
fi

# Eski backupları temizle
DELETED=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +${KEEP_DAYS} -print -delete | wc -l)
echo "[$(date)] Eski backuplar temizlendi (>${KEEP_DAYS} gün, silinen: ${DELETED})"

# Toplam yer kullanımı
du -sh "$BACKUP_DIR"
