#!/bin/bash

# Database Backup Script for UESGM
# This script creates a daily dump of the PostgreSQL database and keeps 30 days of retention.

# Load environment variables if needed
# source .env

# Configuration
DB_URL=${DATABASE_URL}
BACKUP_DIR="./backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="${BACKUP_DIR}/uesgm_db_${DATE}.sql"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

echo "Starting database backup..."

# Perform backup
if [ -z "$DB_URL" ]; then
    echo "Error: DATABASE_URL is not set."
    exit 1
fi

pg_dump ${DB_URL} > ${BACKUP_FILE}

if [ $? -eq 0 ]; then
    echo "Backup successful: ${BACKUP_FILE}"

    # Compress backup
    gzip ${BACKUP_FILE}
    echo "Backup compressed: ${BACKUP_FILE}.gz"

    # Clean up old backups
    echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
    find ${BACKUP_DIR} -name "uesgm_db_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
    echo "Cleanup complete."
else
    echo "Backup failed!"
    exit 1
fi
