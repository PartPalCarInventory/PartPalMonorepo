# PartPal Database Package

Centralized database schema and utilities for the PartPal platform.

## Overview

This package contains:
- Prisma schema for PostgreSQL database
- Database migration scripts
- Seed data for development and testing
- Backup and restore utilities
- Connection pooling configuration

## Quick Start

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma Client
pnpm db:generate
```

### Environment Setup

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://partpal:password@localhost:5432/partpal?schema=public"
```

### Database Commands

```bash
# Generate Prisma Client
pnpm db:generate

# Push schema changes to database (development)
pnpm db:push

# Create and apply migrations (production)
pnpm db:migrate

# Open Prisma Studio (database GUI)
pnpm db:studio

# Seed database with sample data
pnpm db:seed
```

## Database Schema

### Core Models

#### User
Authentication and user management.

```typescript
{
  id: string
  email: string (unique)
  name: string
  password: string (hashed)
  role: "ADMIN" | "SELLER" | "BUYER"
  isVerified: boolean
  emailVerified: DateTime?
}
```

#### Seller
Business profiles for auto parts sellers.

```typescript
{
  id: string
  userId: string (unique)
  businessName: string
  businessType: "SCRAP_YARD" | "DISMANTLER" | "PRIVATE"
  subscriptionPlan: "STARTER" | "PROFESSIONAL" | "ENTERPRISE"
  rating: number?
  // Address, contact info, business hours (JSON)
}
```

#### Vehicle
Vehicles from which parts are sourced.

```typescript
{
  id: string
  vin: string (unique)
  year: number
  make: string
  model: string
  variant: string?
  // Engine, transmission, mileage details
}
```

#### Part
Auto parts inventory.

```typescript
{
  id: string
  name: string
  partNumber: string?
  condition: "NEW" | "EXCELLENT" | "GOOD" | "FAIR" | "POOR"
  price: number
  status: "AVAILABLE" | "RESERVED" | "SOLD"
  isListedOnMarketplace: boolean
  images: JSON (array of URLs)
}
```

#### Category
Hierarchical part categorization.

```typescript
{
  id: string
  name: string (unique)
  parentId: string?
  description: string?
  isActive: boolean
}
```

### Analytics Models

#### AnalyticsEvent
Track user interactions and events.

```typescript
{
  id: string
  eventType: "PART_VIEW" | "SEARCH" | "SELLER_CONTACT"
  partId: string?
  sellerId: string?
  metadata: JSON?
  timestamp: DateTime
}
```

#### ActivityLog
Audit trail of system activities.

```typescript
{
  id: string
  type: string
  description: string
  metadata: JSON?
  timestamp: DateTime
}
```

## Migration from SQLite to PostgreSQL

See [MIGRATION_GUIDE.md](./prisma/MIGRATION_GUIDE.md) for detailed instructions.

### Quick Migration

```bash
# 1. Update schema to PostgreSQL
# Already done in schema.prisma

# 2. Set PostgreSQL connection string
export DATABASE_URL="postgresql://partpal:password@localhost:5432/partpal"

# 3. Create initial migration
pnpm prisma migrate dev --name init

# 4. (Optional) Migrate existing SQLite data
SQLITE_URL="file:./prisma/dev.db" POSTGRES_URL="$DATABASE_URL" \
  node scripts/migrate-sqlite-to-postgres.js

# 5. Seed database
pnpm db:seed
```

## Backup and Restore

### Creating Backups

```bash
# Basic backup
./scripts/backup-database.sh

# Custom backup location
./scripts/backup-database.sh -o /path/to/backups -r 7

# Uncompressed backup
./scripts/backup-database.sh --no-compress
```

### Restoring from Backup

```bash
# Restore from backup file
./scripts/restore-database.sh /path/to/backup.sql.gz

# Drop and recreate database before restore
./scripts/restore-database.sh --drop-database backup.sql.gz

# Dry run (preview without changes)
./scripts/restore-database.sh --dry-run backup.sql.gz
```

### Automated Backups

Set up a cron job for daily backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/scripts/backup-database.sh >> /var/log/partpal-backup.log 2>&1
```

## Connection Pooling

See [CONNECTION_POOLING.md](./CONNECTION_POOLING.md) for comprehensive guide.

### Built-in Prisma Pooling

```env
# Production connection string with pooling
DATABASE_URL="postgresql://partpal:password@localhost:5432/partpal?schema=public&connection_limit=50&pool_timeout=30"
```

### Using PgBouncer

```bash
# Install PgBouncer
sudo apt install pgbouncer

# Configure (see CONNECTION_POOLING.md)
sudo nano /etc/pgbouncer/pgbouncer.ini

# Start service
sudo systemctl start pgbouncer

# Update connection string to use PgBouncer (port 6432)
DATABASE_URL="postgresql://partpal:password@localhost:6432/partpal"
```

## Development

### Schema Changes

```bash
# 1. Edit schema.prisma
nano prisma/schema.prisma

# 2. Create migration
pnpm prisma migrate dev --name descriptive_name

# 3. Generate client
pnpm db:generate
```

### Seed Data

Edit `prisma/seed.ts` to add or modify seed data:

```typescript
// Add new categories, users, sellers, vehicles, or parts
async function createNewData() {
  // Your seed logic here
}
```

Run seed:

```bash
pnpm db:seed
```

### Prisma Studio

Visual database browser:

```bash
pnpm db:studio
# Opens at http://localhost:5555
```

## Production Deployment

### Prerequisites

1. PostgreSQL 14+ installed and running
2. Database created with appropriate user permissions
3. Environment variables configured
4. Connection pooling set up (PgBouncer recommended)

### Deployment Steps

```bash
# 1. Generate Prisma Client
pnpm db:generate

# 2. Run migrations
pnpm prisma migrate deploy

# 3. (Optional) Seed initial data
pnpm db:seed

# 4. Set up automated backups
./scripts/backup-database.sh

# 5. Verify database
pnpm prisma db pull
```

### Environment Variables

```env
# Production
DATABASE_URL="postgresql://partpal:secure_password@db.production:5432/partpal?schema=public&sslmode=require"

# Staging
DATABASE_URL="postgresql://partpal:password@db.staging:5432/partpal_staging?schema=public"

# Development
DATABASE_URL="postgresql://partpal:password@localhost:5432/partpal?schema=public"
```

## Monitoring

### Check Database Health

```sql
-- Active connections
SELECT count(*), state, usename
FROM pg_stat_activity
WHERE datname = 'partpal'
GROUP BY state, usename;

-- Database size
SELECT pg_size_pretty(pg_database_size('partpal'));

-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Performance Monitoring

```sql
-- Slow queries (requires pg_stat_statements extension)
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## Troubleshooting

### Common Issues

#### Connection Refused

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection string
echo $DATABASE_URL

# Test connection
psql -U partpal -d partpal -h localhost
```

#### Migration Conflicts

```bash
# Check migration status
pnpm prisma migrate status

# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset

# Resolve conflicts manually
pnpm prisma migrate resolve --applied MIGRATION_NAME
```

#### Permission Errors

```sql
-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE partpal TO partpal;
GRANT ALL ON SCHEMA public TO partpal;
GRANT ALL ON ALL TABLES IN SCHEMA public TO partpal;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO partpal;
```

## Security Best Practices

1. **Strong Passwords**: Use complex passwords for database users
2. **SSL/TLS**: Enable encrypted connections in production
3. **Least Privilege**: Grant only necessary database permissions
4. **Network Security**: Restrict database access to application servers
5. **Regular Updates**: Keep PostgreSQL and dependencies up to date
6. **Backup Encryption**: Encrypt backup files
7. **Audit Logging**: Enable PostgreSQL audit logs
8. **Connection Limits**: Set appropriate connection limits

## Package Scripts

```json
{
  "db:generate": "prisma generate",
  "db:push": "prisma db push",
  "db:migrate": "prisma migrate dev",
  "db:studio": "prisma studio",
  "db:seed": "tsx prisma/seed.ts"
}
```

## File Structure

```
packages/database/
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── seed.ts                 # Seed data script
│   ├── MIGRATION_GUIDE.md      # SQLite to PostgreSQL guide
│   └── migrations/             # Migration history
├── scripts/
│   ├── backup-database.sh      # Backup script
│   ├── restore-database.sh     # Restore script
│   └── migrate-sqlite-to-postgres.js  # Data migration script
├── CONNECTION_POOLING.md       # Pooling configuration guide
├── README.md                   # This file
└── package.json
```

## Contributing

When making schema changes:

1. Create a descriptive migration name
2. Test migration on development database
3. Verify seed data works with new schema
4. Update type definitions if needed
5. Document breaking changes

## Support

For issues or questions:
- Check [MIGRATION_GUIDE.md](./prisma/MIGRATION_GUIDE.md)
- Check [CONNECTION_POOLING.md](./CONNECTION_POOLING.md)
- Review Prisma documentation: https://www.prisma.io/docs
- Review PostgreSQL documentation: https://www.postgresql.org/docs

## License

Private - PartPal Platform
