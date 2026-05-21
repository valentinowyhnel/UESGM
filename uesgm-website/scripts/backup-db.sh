#!/bin/bash

# Configuration
DB_URL=$DATABASE_URL
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

echo "Starting database backup..."
pg_dump $DB_URL > $BACKUP_DIR/uesgm_backup_$DATE.sql

# Compress
gzip $BACKUP_DIR/uesgm_backup_$DATE.sql

# Cleanup old backups
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $BACKUP_DIR/uesgm_backup_$DATE.sql.gz"
