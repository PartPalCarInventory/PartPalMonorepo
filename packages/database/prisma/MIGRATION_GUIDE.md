# Database Migration Guide: SQLite to PostgreSQL

## Overview

This guide provides step-by-step instructions for migrating the PartPal database from SQLite (development) to PostgreSQL (production).

## Prerequisites

- PostgreSQL 14+ installed and running
- Access to create databases and users
- Backup of current SQLite database (if migrating existing data)
- Environment variables configured

## Migration Steps

### 1. PostgreSQL Setup

#### Install PostgreSQL (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

#### Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE partpal;
CREATE USER partpal WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE partpal TO partpal;

# PostgreSQL 15+ requires additional grants:
\c partpal
GRANT ALL ON SCHEMA public TO partpal;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO partpal;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO partpal;

# Exit PostgreSQL shell
\q
```

### 2. Environment Configuration

Update your `.env` file with PostgreSQL connection string:

```env
# SQLite (old)
# DATABASE_URL="file:./prisma/dev.db"

# PostgreSQL (new)
DATABASE_URL="postgresql://partpal:your_secure_password@localhost:5432/partpal?schema=public"
```

**Production connection string with connection pooling:**

```env
DATABASE_URL="postgresql://partpal:your_secure_password@localhost:5432/partpal?schema=public&connection_limit=10&pool_timeout=20"
```

### 3. Schema Migration

#### Reset Migrations (if starting fresh)

```bash
cd packages/database

# Remove any existing migrations
rm -rf prisma/migrations

# Create initial migration
pnpm prisma migrate dev --name init
```

#### Generate Prisma Client

```bash
pnpm prisma generate
```

### 4. Data Migration (if migrating from existing SQLite)

#### Option A: Using Prisma Studio (Small datasets)

```bash
# 1. Export data from SQLite
# Set DATABASE_URL to SQLite temporarily
DATABASE_URL="file:./prisma/dev.db" pnpm prisma studio

# 2. Manually export data or use pg_dump/pg_restore
```

#### Option B: Using Migration Script (Recommended)

```bash
# Run the data migration script
node scripts/migrate-sqlite-to-postgres.js
```

### 5. Seed Development Data

```bash
# Seed the database with sample data
pnpm db:seed
```

### 6. Verify Migration

```bash
# Check database schema
pnpm prisma studio

# Verify tables exist
psql -U partpal -d partpal -c "\dt"

# Test queries
pnpm prisma db pull
```

## Connection Pooling Configuration

For production environments, implement connection pooling using PgBouncer or Prisma's built-in pooling.

### Using PgBouncer (Recommended for high-traffic applications)

#### Install PgBouncer

```bash
sudo apt install pgbouncer
```

#### Configure PgBouncer (`/etc/pgbouncer/pgbouncer.ini`)

```ini
[databases]
partpal = host=localhost port=5432 dbname=partpal

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 10
reserve_pool_size = 5
reserve_pool_timeout = 3
max_db_connections = 50
```

#### Update Connection String

```env
DATABASE_URL="postgresql://partpal:your_secure_password@localhost:6432/partpal?schema=public"
```

### Using Prisma Connection Pooling

Configure in `schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}
```

## Automated Backups

### Using pg_dump (Daily Backups)

Create backup script `/home/partpal/scripts/backup-database.sh`:

```bash
#!/bin/bash

# Configuration
DB_NAME="partpal"
DB_USER="partpal"
BACKUP_DIR="/var/backups/postgresql/partpal"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform backup
pg_dump -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/partpal_backup_$DATE.sql.gz

# Remove backups older than retention period
find $BACKUP_DIR -name "partpal_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: partpal_backup_$DATE.sql.gz"
```

### Set Up Cron Job

```bash
# Make script executable
chmod +x /home/partpal/scripts/backup-database.sh

# Add to crontab (runs daily at 2 AM)
crontab -e

# Add this line:
0 2 * * * /home/partpal/scripts/backup-database.sh >> /var/log/partpal-backup.log 2>&1
```

## Restore from Backup

```bash
# Decompress and restore
gunzip -c /var/backups/postgresql/partpal/partpal_backup_YYYYMMDD_HHMMSS.sql.gz | psql -U partpal -d partpal
```

## Rollback Procedure

### If Migration Fails

1. **Restore SQLite connection**:
   ```bash
   # Revert DATABASE_URL in .env
   DATABASE_URL="file:./prisma/dev.db"
   ```

2. **Reset Prisma schema**:
   ```bash
   # Checkout original schema
   git checkout packages/database/prisma/schema.prisma

   # Regenerate client
   pnpm prisma generate
   ```

3. **Restart services**:
   ```bash
   pnpm dev
   ```

### If PostgreSQL Database is Corrupted

1. **Drop and recreate database**:
   ```bash
   sudo -u postgres psql
   DROP DATABASE partpal;
   CREATE DATABASE partpal;
   GRANT ALL PRIVILEGES ON DATABASE partpal TO partpal;
   ```

2. **Restore from backup** (if available):
   ```bash
   gunzip -c /path/to/backup.sql.gz | psql -U partpal -d partpal
   ```

3. **Or run fresh migration**:
   ```bash
   pnpm prisma migrate reset
   pnpm db:seed
   ```

## Performance Optimization

### Create Indexes (already defined in schema.prisma)

Verify indexes are created:

```sql
-- Check indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Analyze Tables

```bash
# Update statistics for query planner
psql -U partpal -d partpal -c "ANALYZE;"
```

### Monitor Performance

```sql
-- Check slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Troubleshooting

### Connection Issues

```bash
# Test PostgreSQL connection
psql -U partpal -d partpal -h localhost -p 5432

# Check PostgreSQL is listening
sudo netstat -plnt | grep 5432

# Verify pg_hba.conf allows local connections
sudo cat /etc/postgresql/14/main/pg_hba.conf
```

### Permission Issues

```sql
-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE partpal TO partpal;
GRANT ALL ON SCHEMA public TO partpal;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO partpal;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO partpal;
```

### Migration Errors

```bash
# Check Prisma migration status
pnpm prisma migrate status

# Reset and retry
pnpm prisma migrate reset
pnpm prisma migrate dev
```

## Production Deployment Checklist

- [ ] PostgreSQL installed and configured
- [ ] Database and user created with strong password
- [ ] Connection string updated in environment variables
- [ ] SSL/TLS enabled for database connections
- [ ] Connection pooling configured (PgBouncer or built-in)
- [ ] Automated backups set up and tested
- [ ] Backup restoration tested
- [ ] Monitoring and alerting configured
- [ ] Database firewall rules configured
- [ ] Regular maintenance scheduled (VACUUM, ANALYZE)
- [ ] Disaster recovery plan documented

## Security Best Practices

1. **Use strong passwords** for database users
2. **Enable SSL/TLS** for all database connections
3. **Restrict network access** using firewall rules
4. **Regularly update** PostgreSQL to latest stable version
5. **Monitor access logs** for suspicious activity
6. **Encrypt backups** before storing
7. **Use separate users** for application and admin tasks
8. **Implement row-level security** for multi-tenant features

## References

- [Prisma PostgreSQL Documentation](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [PostgreSQL Official Documentation](https://www.postgresql.org/docs/)
- [PgBouncer Documentation](https://www.pgbouncer.org/)
- [Database Backup Best Practices](https://www.postgresql.org/docs/current/backup.html)
