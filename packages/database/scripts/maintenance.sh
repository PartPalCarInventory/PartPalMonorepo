#!/bin/bash

# PartPal Database Maintenance Script
# Provides database optimization and maintenance tasks

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../" && pwd)"

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

    log_success "All dependencies found"
}

check_database_connection() {
    log_info "Testing database connection..."

    if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        log_error "Cannot connect to database: $DATABASE_URL"
        exit 1
    fi

    log_success "Database connection successful"
}

get_database_stats() {
    log_info "Gathering database statistics..."

    echo "=== Database Overview ==="

    # Database size
    local db_size=$(psql "$DATABASE_URL" -t -c "SELECT pg_size_pretty(pg_database_size(current_database()));")
    echo "Database size: $db_size"

    # Table count
    local table_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")
    echo "Tables: $table_count"

    # Index count
    local index_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public';")
    echo "Indexes: $index_count"

    echo ""
    echo "=== Table Statistics ==="

    # Table sizes and row counts
    psql "$DATABASE_URL" -c "
        SELECT
            schemaname,
            tablename as table_name,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
            pg_stat_get_tuples_returned(c.oid) as rows_read,
            pg_stat_get_tuples_inserted(c.oid) as rows_inserted,
            pg_stat_get_tuples_updated(c.oid) as rows_updated,
            pg_stat_get_tuples_deleted(c.oid) as rows_deleted
        FROM pg_tables t
        JOIN pg_class c ON c.relname = t.tablename
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    "

    echo ""
    echo "=== Index Usage Statistics ==="

    # Index usage
    psql "$DATABASE_URL" -c "
        SELECT
            schemaname,
            tablename,
            indexname,
            idx_tup_read,
            idx_tup_fetch,
            pg_size_pretty(pg_relation_size(indexrelid)) as index_size
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY idx_tup_read DESC;
    "
}

analyze_database() {
    log_info "Running ANALYZE to update table statistics..."

    psql "$DATABASE_URL" -c "ANALYZE;"

    log_success "Database analysis completed"
}

vacuum_database() {
    local vacuum_type=$1

    case $vacuum_type in
        "standard")
            log_info "Running standard VACUUM..."
            psql "$DATABASE_URL" -c "VACUUM;"
            ;;
        "full")
            log_warning "Running VACUUM FULL (this may take a while and require exclusive locks)..."
            psql "$DATABASE_URL" -c "VACUUM FULL;"
            ;;
        "analyze")
            log_info "Running VACUUM ANALYZE..."
            psql "$DATABASE_URL" -c "VACUUM ANALYZE;"
            ;;
        *)
            log_error "Invalid vacuum type: $vacuum_type"
            exit 1
            ;;
    esac

    log_success "VACUUM completed"
}

reindex_database() {
    log_info "Rebuilding database indexes..."

    # Get all indexes in public schema
    local indexes=$(psql "$DATABASE_URL" -t -c "SELECT indexname FROM pg_indexes WHERE schemaname='public' AND indexname NOT LIKE '%_pkey';")

    if [ -n "$indexes" ]; then
        echo "$indexes" | while read -r index; do
            if [ -n "$index" ]; then
                log_info "Reindexing: $index"
                psql "$DATABASE_URL" -c "REINDEX INDEX \"$index\";"
            fi
        done
    fi

    log_success "Database reindexing completed"
}

check_index_bloat() {
    log_info "Checking for index bloat..."

    psql "$DATABASE_URL" -c "
        SELECT
            schemaname,
            tablename,
            indexname,
            pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
            CASE
                WHEN pg_relation_size(indexrelid) > 10485760 THEN 'Large'
                WHEN pg_relation_size(indexrelid) > 1048576 THEN 'Medium'
                ELSE 'Small'
            END as size_category
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY pg_relation_size(indexrelid) DESC;
    "
}

find_unused_indexes() {
    log_info "Finding potentially unused indexes..."

    psql "$DATABASE_URL" -c "
        SELECT
            schemaname,
            tablename,
            indexname,
            idx_tup_read,
            idx_tup_fetch,
            pg_size_pretty(pg_relation_size(indexrelid)) as index_size
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
            AND idx_tup_read = 0
            AND idx_tup_fetch = 0
            AND indexname NOT LIKE '%_pkey'
        ORDER BY pg_relation_size(indexrelid) DESC;
    "

    log_warning "Note: Low usage doesn't necessarily mean the index is unused - it might be used for constraints or occasional queries"
}

check_slow_queries() {
    log_info "Checking for slow queries (requires pg_stat_statements extension)..."

    # Check if pg_stat_statements is available
    local extension_exists=$(psql "$DATABASE_URL" -t -c "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname='pg_stat_statements');")

    if [ "$extension_exists" = " t" ]; then
        psql "$DATABASE_URL" -c "
            SELECT
                query,
                calls,
                total_time,
                mean_time,
                rows
            FROM pg_stat_statements
            WHERE query NOT LIKE '%pg_stat_statements%'
            ORDER BY mean_time DESC
            LIMIT 10;
        "
    else
        log_warning "pg_stat_statements extension not found. Install it to track query performance."
    fi
}

optimize_tables() {
    log_info "Optimizing tables based on usage patterns..."

    # Find tables with high update/delete activity that might benefit from more frequent vacuuming
    psql "$DATABASE_URL" -c "
        SELECT
            schemaname,
            tablename,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes,
            n_dead_tup as dead_tuples,
            CASE
                WHEN n_dead_tup > 1000 THEN 'High maintenance needed'
                WHEN n_dead_tup > 100 THEN 'Medium maintenance needed'
                ELSE 'Low maintenance needed'
            END as maintenance_priority
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY n_dead_tup DESC;
    "
}

cleanup_old_data() {
    log_info "Checking for old data that might need cleanup..."

    # Check for old refresh tokens (older than 30 days)
    local old_tokens=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM refresh_tokens WHERE created_at < NOW() - INTERVAL '30 days';")
    if [ "$old_tokens" -gt 0 ]; then
        log_warning "Found $old_tokens expired refresh tokens"
        read -p "Delete expired refresh tokens? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            psql "$DATABASE_URL" -c "DELETE FROM refresh_tokens WHERE created_at < NOW() - INTERVAL '30 days';"
            log_success "Deleted expired refresh tokens"
        fi
    fi

    # Check for test data or unrealistic entries
    local test_users=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users WHERE email LIKE '%@test.%' OR email LIKE '%@example.%';")
    if [ "$test_users" -gt 0 ]; then
        log_warning "Found $test_users potential test user accounts"
    fi
}

generate_maintenance_report() {
    local report_file="$PROJECT_ROOT/database_maintenance_report_$(date +%Y%m%d_%H%M%S).txt"

    log_info "Generating maintenance report..."

    {
        echo "PartPal Database Maintenance Report"
        echo "Generated: $(date)"
        echo "Database: $DATABASE_URL"
        echo "=================================="
        echo ""

        echo "Database Statistics:"
        psql "$DATABASE_URL" -c "SELECT pg_size_pretty(pg_database_size(current_database())) as database_size;"
        echo ""

        echo "Table Statistics:"
        psql "$DATABASE_URL" -c "
            SELECT
                tablename,
                pg_size_pretty(pg_total_relation_size(tablename)) as total_size,
                pg_size_pretty(pg_relation_size(tablename)) as table_size
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY pg_total_relation_size(tablename) DESC;
        "
        echo ""

        echo "Index Statistics:"
        psql "$DATABASE_URL" -c "
            SELECT
                indexname,
                pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
                idx_tup_read,
                idx_tup_fetch
            FROM pg_stat_user_indexes
            WHERE schemaname = 'public'
            ORDER BY pg_relation_size(indexrelid) DESC;
        "
    } > "$report_file"

    log_success "Maintenance report generated: $report_file"
}

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -s, --stats          Show database statistics"
    echo "  -a, --analyze        Run ANALYZE to update statistics"
    echo "  -v, --vacuum TYPE    Run VACUUM (standard, full, analyze)"
    echo "  -r, --reindex        Rebuild all indexes"
    echo "  -b, --bloat          Check for index bloat"
    echo "  -u, --unused         Find unused indexes"
    echo "  -q, --queries        Check slow queries"
    echo "  -o, --optimize       Optimize tables"
    echo "  -c, --cleanup        Clean up old data"
    echo "  -R, --report         Generate maintenance report"
    echo "  --full-maintenance   Run complete maintenance routine"
    echo "  -h, --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --stats                 # Show database statistics"
    echo "  $0 --vacuum analyze        # Run VACUUM ANALYZE"
    echo "  $0 --full-maintenance      # Run complete maintenance"
}

run_full_maintenance() {
    log_info "Running full maintenance routine..."

    get_database_stats
    analyze_database
    vacuum_database "analyze"
    check_index_bloat
    find_unused_indexes
    optimize_tables
    cleanup_old_data
    generate_maintenance_report

    log_success "Full maintenance routine completed"
}

# Main script
main() {
    # Default options
    SHOW_STATS=false
    RUN_ANALYZE=false
    VACUUM_TYPE=""
    RUN_REINDEX=false
    CHECK_BLOAT=false
    FIND_UNUSED=false
    CHECK_QUERIES=false
    OPTIMIZE_TABLES=false
    CLEANUP_DATA=false
    GENERATE_REPORT=false
    FULL_MAINTENANCE=false

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -s|--stats)
                SHOW_STATS=true
                shift
                ;;
            -a|--analyze)
                RUN_ANALYZE=true
                shift
                ;;
            -v|--vacuum)
                VACUUM_TYPE="$2"
                shift 2
                ;;
            -r|--reindex)
                RUN_REINDEX=true
                shift
                ;;
            -b|--bloat)
                CHECK_BLOAT=true
                shift
                ;;
            -u|--unused)
                FIND_UNUSED=true
                shift
                ;;
            -q|--queries)
                CHECK_QUERIES=true
                shift
                ;;
            -o|--optimize)
                OPTIMIZE_TABLES=true
                shift
                ;;
            -c|--cleanup)
                CLEANUP_DATA=true
                shift
                ;;
            -R|--report)
                GENERATE_REPORT=true
                shift
                ;;
            --full-maintenance)
                FULL_MAINTENANCE=true
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

    # If no options specified, show usage
    if [ "$SHOW_STATS" = false ] && [ "$RUN_ANALYZE" = false ] && [ -z "$VACUUM_TYPE" ] && \
       [ "$RUN_REINDEX" = false ] && [ "$CHECK_BLOAT" = false ] && [ "$FIND_UNUSED" = false ] && \
       [ "$CHECK_QUERIES" = false ] && [ "$OPTIMIZE_TABLES" = false ] && [ "$CLEANUP_DATA" = false ] && \
       [ "$GENERATE_REPORT" = false ] && [ "$FULL_MAINTENANCE" = false ]; then
        show_usage
        exit 1
    fi

    log_info "Starting PartPal database maintenance..."

    check_dependencies
    check_database_connection

    # Run full maintenance if requested
    if [ "$FULL_MAINTENANCE" = true ]; then
        run_full_maintenance
        exit 0
    fi

    # Run individual operations
    if [ "$SHOW_STATS" = true ]; then
        get_database_stats
    fi

    if [ "$RUN_ANALYZE" = true ]; then
        analyze_database
    fi

    if [ -n "$VACUUM_TYPE" ]; then
        vacuum_database "$VACUUM_TYPE"
    fi

    if [ "$RUN_REINDEX" = true ]; then
        reindex_database
    fi

    if [ "$CHECK_BLOAT" = true ]; then
        check_index_bloat
    fi

    if [ "$FIND_UNUSED" = true ]; then
        find_unused_indexes
    fi

    if [ "$CHECK_QUERIES" = true ]; then
        check_slow_queries
    fi

    if [ "$OPTIMIZE_TABLES" = true ]; then
        optimize_tables
    fi

    if [ "$CLEANUP_DATA" = true ]; then
        cleanup_old_data
    fi

    if [ "$GENERATE_REPORT" = true ]; then
        generate_maintenance_report
    fi

    log_success "Database maintenance completed successfully!"
}

# Run main function with all arguments
main "$@"