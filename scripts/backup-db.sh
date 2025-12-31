#!/bin/bash

# Database backup script

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "🗄️  Starting database backup..."

# Extract database details from DATABASE_URL
# Format: postgresql://user:password@host:port/database

pg_dump $DATABASE_URL > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully: $BACKUP_FILE"
    
    # Compress backup
    gzip $BACKUP_FILE
    echo "✅ Backup compressed: ${BACKUP_FILE}.gz"
    
    # Delete backups older than 7 days
    find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
    echo "🗑️  Old backups cleaned up"
else
    echo "❌ Backup failed"
    exit 1
fi
