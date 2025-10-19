#!/bin/bash

###############################################################################
# PostgreSQL Database Restore Script for PartPal
#
# This script restores a PostgreSQL database from a backup file.
#
# Usage:
#   ./scripts/restore-database.sh [options] BACKUP_FILE
#
# Options:
#   -h, --help              Show this help message
#   -d, --database NAME     Database name (default: partpal)
#   -u, --user NAME         Database user (default: partpal)
#   --drop-database         Drop and recreate database before restore
#   --dry-run               Show what would be done without actually restoring
#
# Example:
#   ./scripts/restore-database.sh /var/backups/postgresql/partpal/partpal_20241019_140000.sql.gz
#   ./scripts/restore-database.sh --drop-database backup.sql.gz
#
###############################################################################

set -euo pipefail

# Default configuration
DB_NAME="${DB_NAME:-partpal}"
DB_USER="${DB_USER:-partpal}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DROP_DATABASE=false
DRY_RUN=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*"
}

error() {
  echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $*" >&2
}

warning() {
  echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $*"
}

info() {
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $*"
}

# Parse command line arguments
BACKUP_FILE=""
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      head -n 20 "$0" | tail -n 16
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
    --drop-database)
      DROP_DATABASE=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -*)
      error "Unknown option: $1"
      exit 1
      ;;
    *)
      BACKUP_FILE="$1"
      shift
      ;;
  esac
done

# Validate backup file
if [[ -z "$BACKUP_FILE" ]]; then
  error "No backup file specified"
  echo "Usage: $0 [options] BACKUP_FILE"
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  error "Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Check if PostgreSQL client is installed
if ! command -v psql &> /dev/null; then
  error "psql command not found. Please install postgresql-client."
  exit 1
fi

# Display restore information
echo "=============================================================================="
echo "                    DATABASE RESTORE OPERATION"
echo "=============================================================================="
log "Database: $DB_NAME"
log "User: $DB_USER"
log "Host: $DB_HOST:$DB_PORT"
log "Backup file: $BACKUP_FILE"
log "File size: $(du -h "$BACKUP_FILE" | cut -f1)"
log "Drop database: $DROP_DATABASE"
log "Dry run: $DRY_RUN"
echo "=============================================================================="

# Check if file is compressed
IS_COMPRESSED=false
if [[ "$BACKUP_FILE" == *.gz ]]; then
  IS_COMPRESSED=true
  log "Backup file is compressed (gzip)"

  # Verify gzip integrity
  if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
    error "Backup file is corrupted or not a valid gzip file"
    exit 1
  fi
  log "Backup file integrity verified"
fi

# Confirmation prompt (skip in dry-run mode)
if [[ "$DRY_RUN" == false ]]; then
  warning "This operation will restore the database '$DB_NAME'"
  if [[ "$DROP_DATABASE" == true ]]; then
    warning "The database will be DROPPED and recreated!"
  fi
  warning "All current data will be LOST!"
  echo ""
  read -p "Are you sure you want to continue? (yes/no): " -r
  echo ""

  if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log "Restore operation cancelled by user"
    exit 0
  fi
fi

# Check database connection
if ! PGPASSWORD="${DB_PASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c '\q' 2>/dev/null; then
  error "Cannot connect to PostgreSQL server on $DB_HOST:$DB_PORT"
  error "Please check your database credentials and ensure PostgreSQL is running."
  exit 1
fi

if [[ "$DRY_RUN" == true ]]; then
  info "DRY RUN MODE - No changes will be made"
  log "Would restore from: $BACKUP_FILE"
  if [[ "$DROP_DATABASE" == true ]]; then
    log "Would drop and recreate database: $DB_NAME"
  fi
  log "Would restore to database: $DB_NAME on $DB_HOST:$DB_PORT"
  exit 0
fi

# Drop and recreate database if requested
if [[ "$DROP_DATABASE" == true ]]; then
  warning "Dropping database '$DB_NAME'..."

  # Terminate all connections to the database
  PGPASSWORD="${DB_PASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" \
    > /dev/null 2>&1 || true

  # Drop database
  if PGPASSWORD="${DB_PASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c \
    "DROP DATABASE IF EXISTS $DB_NAME;" > /dev/null 2>&1; then
    log "Database dropped successfully"
  else
    error "Failed to drop database"
    exit 1
  fi

  # Create database
  log "Creating database '$DB_NAME'..."
  if PGPASSWORD="${DB_PASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c \
    "CREATE DATABASE $DB_NAME OWNER $DB_USER;" > /dev/null 2>&1; then
    log "Database created successfully"
  else
    error "Failed to create database"
    exit 1
  fi
fi

# Restore database
log "Starting database restore..."

if [[ "$IS_COMPRESSED" == true ]]; then
  # Restore from compressed backup
  if gunzip -c "$BACKUP_FILE" | PGPASSWORD="${DB_PASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --set ON_ERROR_STOP=on > /dev/null 2>&1; then
    log "Database restored successfully from compressed backup"
  else
    error "Restore failed"
    exit 1
  fi
else
  # Restore from uncompressed backup
  if PGPASSWORD="${DB_PASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --set ON_ERROR_STOP=on -f "$BACKUP_FILE" > /dev/null 2>&1; then
    log "Database restored successfully"
  else
    error "Restore failed"
    exit 1
  fi
fi

# Verify restore
log "Verifying restore..."

# Check if database has tables
TABLE_COUNT=$(PGPASSWORD="${DB_PASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)

if [[ "$TABLE_COUNT" -gt 0 ]]; then
  log "Verification successful: Found $TABLE_COUNT tables"
else
  warning "Verification warning: No tables found in restored database"
fi

# Run ANALYZE to update statistics
log "Updating database statistics..."
PGPASSWORD="${DB_PASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "ANALYZE;" > /dev/null 2>&1
log "Database statistics updated"

echo "=============================================================================="
log "Restore completed successfully!"
log "Database '$DB_NAME' has been restored from $BACKUP_FILE"
echo "=============================================================================="

exit 0
