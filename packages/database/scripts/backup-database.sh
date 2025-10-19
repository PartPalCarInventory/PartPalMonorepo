#!/bin/bash

###############################################################################
# PostgreSQL Database Backup Script for PartPal
#
# This script creates compressed backups of the PostgreSQL database
# and manages backup retention.
#
# Usage:
#   ./scripts/backup-database.sh [options]
#
# Options:
#   -h, --help              Show this help message
#   -d, --database NAME     Database name (default: partpal)
#   -u, --user NAME         Database user (default: partpal)
#   -o, --output DIR        Backup directory (default: /var/backups/postgresql/partpal)
#   -r, --retention DAYS    Retention period in days (default: 30)
#   --no-compress           Don't compress the backup
#
# Example:
#   ./scripts/backup-database.sh -d partpal -u partpal -r 7
#
###############################################################################

set -euo pipefail

# Default configuration
DB_NAME="${DB_NAME:-partpal}"
DB_USER="${DB_USER:-partpal}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgresql/partpal}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
COMPRESS=true
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_DIR=$(date +%Y/%m/%d)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      head -n 26 "$0" | tail -n 22
      exit 0
      ;;
    -d|--database)
      DB_NAME="$2"
      shift 2
      ;;
    -u|--user)
      DB_USER="$2"
      shift 2
      ;;
    -o|--output)
      BACKUP_DIR="$2"
      shift 2
      ;;
    -r|--retention)
      RETENTION_DAYS="$2"
      shift 2
      ;;
    --no-compress)
      COMPRESS=false
      shift
      ;;
    *)
      echo -e "${RED}Error: Unknown option $1${NC}"
      exit 1
      ;;
  esac
done

# Logging function
log() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*"
}

error() {
  echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $*" >&2
}

warning() {
  echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $*"
}

# Check if PostgreSQL client is installed
if ! command -v pg_dump &> /dev/null; then
  error "pg_dump command not found. Please install postgresql-client."
  exit 1
fi

# Check database connection
if ! PGPASSWORD="${DB_PASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; then
  error "Cannot connect to database $DB_NAME on $DB_HOST:$DB_PORT"
  error "Please check your database credentials and ensure PostgreSQL is running."
  exit 1
fi

# Create backup directory if it doesn't exist
FULL_BACKUP_DIR="$BACKUP_DIR/$DATE_DIR"
mkdir -p "$FULL_BACKUP_DIR"

if [[ ! -w "$FULL_BACKUP_DIR" ]]; then
  error "Backup directory $FULL_BACKUP_DIR is not writable"
  exit 1
fi

log "Starting backup of database '$DB_NAME'"
log "Backup directory: $FULL_BACKUP_DIR"

# Create backup filename
if [[ "$COMPRESS" == true ]]; then
  BACKUP_FILE="$FULL_BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"
  log "Creating compressed backup: $BACKUP_FILE"

  # Perform backup with compression
  if PGPASSWORD="${DB_PASSWORD:-}" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --format=plain \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    | gzip > "$BACKUP_FILE"; then

    log "Backup created successfully"
  else
    error "Backup failed"
    exit 1
  fi
else
  BACKUP_FILE="$FULL_BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"
  log "Creating uncompressed backup: $BACKUP_FILE"

  # Perform backup without compression
  if PGPASSWORD="${DB_PASSWORD:-}" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --format=plain \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    > "$BACKUP_FILE"; then

    log "Backup created successfully"
  else
    error "Backup failed"
    exit 1
  fi
fi

# Get backup file size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup size: $BACKUP_SIZE"

# Create a 'latest' symlink
LATEST_LINK="$BACKUP_DIR/latest"
ln -sf "$BACKUP_FILE" "$LATEST_LINK"
log "Updated 'latest' symlink"

# Clean up old backups
log "Cleaning up backups older than $RETENTION_DAYS days..."

if [[ "$COMPRESS" == true ]]; then
  DELETED_COUNT=$(find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -type f -mtime +"$RETENTION_DAYS" -delete -print | wc -l)
else
  DELETED_COUNT=$(find "$BACKUP_DIR" -name "${DB_NAME}_*.sql" -type f -mtime +"$RETENTION_DAYS" -delete -print | wc -l)
fi

if [[ "$DELETED_COUNT" -gt 0 ]]; then
  log "Deleted $DELETED_COUNT old backup(s)"
else
  log "No old backups to delete"
fi

# Summary
log "Backup completed successfully!"
log "Backup file: $BACKUP_FILE"
log "Retention period: $RETENTION_DAYS days"

# Verify backup integrity
log "Verifying backup integrity..."
if [[ "$COMPRESS" == true ]]; then
  if gzip -t "$BACKUP_FILE" 2>/dev/null; then
    log "Backup file integrity verified"
  else
    error "Backup file is corrupted!"
    exit 1
  fi
fi

# Calculate total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "Total backup directory size: $TOTAL_SIZE"

exit 0
