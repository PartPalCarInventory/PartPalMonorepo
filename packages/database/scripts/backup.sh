#!/bin/bash

# PartPal Database Backup Script
# Provides automated backup functionality for PostgreSQL database

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../" && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
fi

# Default values
DATABASE_URL=${DATABASE_URL:-"postgresql://partpal:password@localhost:5432/partpal"}
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

# Security settings
BACKUP_ENCRYPTION_ENABLED=${BACKUP_ENCRYPTION_ENABLED:-true}
BACKUP_ENCRYPTION_KEY=${BACKUP_ENCRYPTION_KEY:-""}
BACKUP_PERMISSIONS=${BACKUP_PERMISSIONS:-600}
SECURE_DELETE=${SECURE_DELETE:-true}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."

    if ! command -v pg_dump &> /dev/null; then
        log_error "pg_dump not found. Please install PostgreSQL client tools."
        exit 1
    fi

    if ! command -v gzip &> /dev/null; then
        log_error "gzip not found. Please install gzip."
        exit 1
    fi

    # Check encryption dependencies if enabled
    if [ "$BACKUP_ENCRYPTION_ENABLED" = true ]; then
        if ! command -v openssl &> /dev/null; then
            log_error "openssl not found. Required for backup encryption."
            exit 1
        fi

        if [ -z "$BACKUP_ENCRYPTION_KEY" ]; then
            log_error "BACKUP_ENCRYPTION_KEY is required when encryption is enabled."
            exit 1
        fi
    fi

    log_success "All dependencies found"
}

create_backup_directory() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"

        # Set secure permissions on backup directory
        chmod 750 "$BACKUP_DIR"
        log_info "Set secure permissions (750) on backup directory"
    fi
}

perform_backup() {
    local backup_type=$1
    local backup_file=""
    local temp_file=""

    case $backup_type in
        "full")
            backup_file="${BACKUP_DIR}/partpal_full_${DATE}.sql"
            log_info "Creating full database backup..."
            pg_dump "$DATABASE_URL" > "$backup_file"
            ;;
        "schema")
            backup_file="${BACKUP_DIR}/partpal_schema_${DATE}.sql"
            log_info "Creating schema-only backup..."
            pg_dump "$DATABASE_URL" --schema-only > "$backup_file"
            ;;
        "data")
            backup_file="${BACKUP_DIR}/partpal_data_${DATE}.sql"
            log_info "Creating data-only backup..."
            pg_dump "$DATABASE_URL" --data-only > "$backup_file"
            ;;
        *)
            log_error "Invalid backup type: $backup_type"
            exit 1
            ;;
    esac

    if [ -f "$backup_file" ]; then
        # Set secure permissions on backup file
        chmod "$BACKUP_PERMISSIONS" "$backup_file"

        # Compress the backup
        log_info "Compressing backup..."
        gzip "$backup_file"
        backup_file="${backup_file}.gz"

        # Encrypt if enabled
        if [ "$BACKUP_ENCRYPTION_ENABLED" = true ]; then
            log_info "Encrypting backup..."
            encrypted_file="${backup_file}.enc"
            openssl enc -aes-256-cbc -salt -in "$backup_file" -out "$encrypted_file" -pass pass:"$BACKUP_ENCRYPTION_KEY"

            # Securely delete unencrypted file
            if [ "$SECURE_DELETE" = true ] && command -v shred &> /dev/null; then
                shred -vfz -n 3 "$backup_file"
            else
                rm -f "$backup_file"
            fi

            backup_file="$encrypted_file"
        fi

        # Set final permissions
        chmod "$BACKUP_PERMISSIONS" "$backup_file"

        local file_size=$(du -h "$backup_file" | cut -f1)
        log_success "Backup created: $backup_file (Size: $file_size)"
        echo "$backup_file"
    else
        log_error "Backup failed!"
        exit 1
    fi
}

cleanup_old_backups() {
    log_info "Cleaning up backups older than $BACKUP_RETENTION_DAYS days..."

    local deleted_count=0

    # Find and securely delete old backup files
    while IFS= read -r -d '' file; do
        # Securely delete if enabled
        if [ "$SECURE_DELETE" = true ] && command -v shred &> /dev/null; then
            shred -vfz -n 3 "$file"
            log_info "Securely deleted old backup: $(basename "$file")"
        else
            rm "$file"
            log_info "Deleted old backup: $(basename "$file")"
        fi
        ((deleted_count++))
    done < <(find "$BACKUP_DIR" -name "partpal_*.sql.gz*" -mtime +$BACKUP_RETENTION_DAYS -print0 2>/dev/null)

    if [ $deleted_count -eq 0 ]; then
        log_info "No old backups to clean up"
    else
        log_success "Cleaned up $deleted_count old backup(s)"
    fi
}

verify_backup() {
    local backup_file=$1

    log_info "Verifying backup integrity..."

    if ! gzip -t "$backup_file" 2>/dev/null; then
        log_error "Backup file is corrupted: $backup_file"
        exit 1
    fi

    # Check if the backup contains actual data
    local line_count=$(zcat "$backup_file" | wc -l)
    if [ "$line_count" -lt 10 ]; then
        log_error "Backup file appears to be empty or incomplete"
        exit 1
    fi

    log_success "Backup verification passed"
}

create_backup_manifest() {
    local backup_file=$1
    local manifest_file="${backup_file}.manifest"

    log_info "Creating backup manifest..."

    cat > "$manifest_file" << EOF
{
  "backup_file": "$(basename "$backup_file")",
  "timestamp": "$DATE",
  "database_url": "$DATABASE_URL",
  "file_size": "$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file")",
  "checksum": "$(shasum -a 256 "$backup_file" | cut -d' ' -f1)",
  "backup_type": "$BACKUP_TYPE",
  "retention_days": "$BACKUP_RETENTION_DAYS"
}
EOF

    log_success "Manifest created: $manifest_file"
}

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -t, --type TYPE     Backup type: full, schema, data (default: full)"
    echo "  -r, --retention N   Retention period in days (default: 30)"
    echo "  -v, --verify        Verify backup after creation"
    echo "  -c, --cleanup       Clean up old backups"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                          # Create full backup"
    echo "  $0 --type schema            # Create schema-only backup"
    echo "  $0 --verify --cleanup       # Create backup, verify, and cleanup old backups"
}

# Main script
main() {
    # Default options
    BACKUP_TYPE="full"
    VERIFY_BACKUP=false
    CLEANUP_OLD=false

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--type)
                BACKUP_TYPE="$2"
                shift 2
                ;;
            -r|--retention)
                BACKUP_RETENTION_DAYS="$2"
                shift 2
                ;;
            -v|--verify)
                VERIFY_BACKUP=true
                shift
                ;;
            -c|--cleanup)
                CLEANUP_OLD=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    log_info "Starting PartPal database backup process..."
    log_info "Backup type: $BACKUP_TYPE"
    log_info "Retention period: $BACKUP_RETENTION_DAYS days"

    check_dependencies
    create_backup_directory

    # Perform the backup
    backup_file=$(perform_backup "$BACKUP_TYPE")

    # Verify backup if requested
    if [ "$VERIFY_BACKUP" = true ]; then
        verify_backup "$backup_file"
    fi

    # Create manifest
    create_backup_manifest "$backup_file"

    # Cleanup old backups if requested
    if [ "$CLEANUP_OLD" = true ]; then
        cleanup_old_backups
    fi

    log_success "Database backup process completed successfully!"
    log_info "Backup location: $backup_file"
}

# Run main function with all arguments
main "$@"