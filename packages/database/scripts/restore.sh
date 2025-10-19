#!/bin/bash

# PartPal Database Restore Script
# Provides automated restore functionality for PostgreSQL database

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../" && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
fi

# Default values
DATABASE_URL=${DATABASE_URL:-"postgresql://partpal:password@localhost:5432/partpal"}

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

    if ! command -v psql &> /dev/null; then
        log_error "psql not found. Please install PostgreSQL client tools."
        exit 1
    fi

    if ! command -v gzip &> /dev/null; then
        log_error "gzip not found. Please install gzip."
        exit 1
    fi

    log_success "All dependencies found"
}

verify_backup_file() {
    local backup_file=$1

    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi

    log_info "Verifying backup file integrity..."

    if ! gzip -t "$backup_file" 2>/dev/null; then
        log_error "Backup file is corrupted: $backup_file"
        exit 1
    fi

    local line_count=$(zcat "$backup_file" | wc -l)
    if [ "$line_count" -lt 10 ]; then
        log_error "Backup file appears to be empty or incomplete"
        exit 1
    fi

    log_success "Backup file verification passed"
}

check_database_connection() {
    log_info "Testing database connection..."

    if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        log_error "Cannot connect to database: $DATABASE_URL"
        exit 1
    fi

    log_success "Database connection successful"
}

backup_current_database() {
    log_info "Creating safety backup of current database..."

    local safety_backup="${BACKUP_DIR}/safety_backup_$(date +%Y%m%d_%H%M%S).sql.gz"

    # Ensure backup directory exists
    mkdir -p "$BACKUP_DIR"

    # Create safety backup
    pg_dump "$DATABASE_URL" | gzip > "$safety_backup"

    log_success "Safety backup created: $safety_backup"
}

get_database_info() {
    # Extract database name from URL
    echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p'
}

drop_database_objects() {
    local db_name=$(get_database_info)

    log_warning "Dropping existing database objects..."

    # Get list of tables to drop
    local tables=$(psql "$DATABASE_URL" -t -c "SELECT string_agg(tablename, ', ') FROM pg_tables WHERE schemaname='public';")

    if [ -n "$tables" ] && [ "$tables" != " " ]; then
        log_info "Dropping tables: $tables"
        psql "$DATABASE_URL" -c "DROP TABLE IF EXISTS $tables CASCADE;"
    fi

    # Drop sequences
    local sequences=$(psql "$DATABASE_URL" -t -c "SELECT string_agg(sequencename, ', ') FROM pg_sequences WHERE schemaname='public';")

    if [ -n "$sequences" ] && [ "$sequences" != " " ]; then
        log_info "Dropping sequences: $sequences"
        psql "$DATABASE_URL" -c "DROP SEQUENCE IF EXISTS $sequences CASCADE;"
    fi

    log_success "Database objects dropped"
}

perform_restore() {
    local backup_file=$1
    local restore_type=$2

    log_info "Starting database restore from: $(basename "$backup_file")"
    log_info "Restore type: $restore_type"

    case $restore_type in
        "full")
            # For full restore, drop existing objects first
            drop_database_objects
            zcat "$backup_file" | psql "$DATABASE_URL"
            ;;
        "schema")
            # For schema restore, drop existing objects first
            drop_database_objects
            zcat "$backup_file" | psql "$DATABASE_URL"
            ;;
        "data")
            # For data restore, just insert data (assumes schema exists)
            zcat "$backup_file" | psql "$DATABASE_URL"
            ;;
        *)
            log_error "Invalid restore type: $restore_type"
            exit 1
            ;;
    esac

    log_success "Database restore completed successfully"
}

verify_restore() {
    log_info "Verifying restore integrity..."

    # Check if database has tables
    local table_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")

    if [ "$table_count" -eq 0 ]; then
        log_error "No tables found after restore"
        exit 1
    fi

    log_info "Found $table_count tables in database"

    # Check if we have data (check users table as it should always exist)
    if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;" > /dev/null 2>&1; then
        local user_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users;")
        log_info "Found $user_count users in database"
    fi

    log_success "Restore verification passed"
}

list_available_backups() {
    log_info "Available backup files in $BACKUP_DIR:"

    if [ ! -d "$BACKUP_DIR" ]; then
        log_warning "Backup directory does not exist: $BACKUP_DIR"
        return
    fi

    local count=0
    for file in "$BACKUP_DIR"/partpal_*.sql.gz; do
        if [ -f "$file" ]; then
            local size=$(du -h "$file" | cut -f1)
            local date=$(stat -f%Sm -t"%Y-%m-%d %H:%M:%S" "$file" 2>/dev/null || stat -c%y "$file" | cut -d' ' -f1-2)
            echo "  $(basename "$file") (Size: $size, Date: $date)"
            ((count++))
        fi
    done

    if [ $count -eq 0 ]; then
        log_warning "No backup files found"
    else
        log_info "Total backups found: $count"
    fi
}

show_usage() {
    echo "Usage: $0 [OPTIONS] BACKUP_FILE"
    echo ""
    echo "Options:"
    echo "  -t, --type TYPE     Restore type: full, schema, data (default: full)"
    echo "  -s, --safety        Create safety backup before restore"
    echo "  -v, --verify        Verify restore after completion"
    echo "  -l, --list          List available backup files"
    echo "  -f, --force         Skip confirmation prompts"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 partpal_full_20241004_120000.sql.gz"
    echo "  $0 --type schema partpal_schema_20241004_120000.sql.gz"
    echo "  $0 --safety --verify partpal_full_20241004_120000.sql.gz"
    echo "  $0 --list"
}

confirm_action() {
    if [ "$FORCE" = true ]; then
        return 0
    fi

    echo -e "${YELLOW}WARNING: This will replace the current database contents!${NC}"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Restore cancelled by user"
        exit 0
    fi
}

# Main script
main() {
    # Default options
    RESTORE_TYPE="full"
    SAFETY_BACKUP=false
    VERIFY_RESTORE=false
    LIST_BACKUPS=false
    FORCE=false
    BACKUP_FILE=""

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--type)
                RESTORE_TYPE="$2"
                shift 2
                ;;
            -s|--safety)
                SAFETY_BACKUP=true
                shift
                ;;
            -v|--verify)
                VERIFY_RESTORE=true
                shift
                ;;
            -l|--list)
                LIST_BACKUPS=true
                shift
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            -*)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                BACKUP_FILE="$1"
                shift
                ;;
        esac
    done

    # Handle list option
    if [ "$LIST_BACKUPS" = true ]; then
        list_available_backups
        exit 0
    fi

    # Check if backup file is provided
    if [ -z "$BACKUP_FILE" ]; then
        log_error "No backup file specified"
        show_usage
        exit 1
    fi

    # If backup file doesn't contain path, assume it's in backup directory
    if [[ "$BACKUP_FILE" != /* ]]; then
        BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
    fi

    log_info "Starting PartPal database restore process..."
    log_info "Backup file: $BACKUP_FILE"
    log_info "Restore type: $RESTORE_TYPE"

    check_dependencies
    verify_backup_file "$BACKUP_FILE"
    check_database_connection

    # Confirm the action
    confirm_action

    # Create safety backup if requested
    if [ "$SAFETY_BACKUP" = true ]; then
        backup_current_database
    fi

    # Perform the restore
    perform_restore "$BACKUP_FILE" "$RESTORE_TYPE"

    # Verify restore if requested
    if [ "$VERIFY_RESTORE" = true ]; then
        verify_restore
    fi

    log_success "Database restore process completed successfully!"
}

# Run main function with all arguments
main "$@"