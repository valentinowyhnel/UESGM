#!/bin/bash

# UESGM Database Backup Script
# Usage: ./backup-db.sh [DATABASE_URL] [BACKUP_DIR]

DB_URL=${1:-$DATABASE_URL}
BACKUP_DIR=${2:-"./backups"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="uesgm_backup_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

echo "Starting backup of UESGM database..."
pg_dump $DB_URL > $BACKUP_DIR/$FILENAME

if [ $? -eq 0 ]; then
  echo "Backup successful: $BACKUP_DIR/$FILENAME"
  # Keep only last 30 days
  find $BACKUP_DIR -name "uesgm_backup_*.sql" -mtime +30 -delete
else
  echo "Backup failed!"
  exit 1
fi
