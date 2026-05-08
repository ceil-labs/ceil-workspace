#!/bin/bash
# Memoria PostgreSQL Backup Script
# Creates a timestamped custom-format dump of the memoria_db

BACKUP_DIR="/home/openclaw/.openclaw/workspace/backups"
CONTAINER="memoria-postgres-1"
DB_USER="memory"
DB_NAME="memoria_db"
# Password is from .env — if changed, update here or pass as env var
PGPASSWORD="${PGPASSWORD:-changeme}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/memoria_db_backup_${TIMESTAMP}.dump"

echo "Creating Memoria DB backup..."
echo "  Container: ${CONTAINER}"
echo "  Database:  ${DB_NAME}"
echo "  File:      ${BACKUP_FILE}"

mkdir -p "${BACKUP_DIR}"

# Run pg_dump inside container, stream output to host
docker exec -e PGPASSWORD="${PGPASSWORD}" "${CONTAINER}" \
    pg_dump -U "${DB_USER}" -d "${DB_NAME}" -Fc \
    > "${BACKUP_FILE}"

if [ $? -eq 0 ] && [ -s "${BACKUP_FILE}" ]; then
    SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "✅ Backup created: ${BACKUP_FILE} (${SIZE})"
    echo "   Verify: file ${BACKUP_FILE}"
else
    echo "❌ Backup failed"
    rm -f "${BACKUP_FILE}"
    exit 1
fi

# Optional: keep only last N backups
KEEP_COUNT=10
ls -t ${BACKUP_DIR}/memoria_db_backup_*.dump 2>/dev/null | tail -n +$((KEEP_COUNT + 1)) | xargs -r rm -f

echo "Done."
