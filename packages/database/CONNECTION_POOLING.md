# Connection Pooling Configuration for PostgreSQL

## Overview

Connection pooling is essential for production PostgreSQL deployments to:
- Reduce connection overhead
- Manage database connections efficiently
- Improve application performance
- Handle high concurrent user loads

## Implementation Options

### Option 1: Prisma Connection Pooling (Built-in)

Prisma provides built-in connection pooling through its query engine.

#### Configuration in Environment Variables

```env
# Basic connection with pooling parameters
DATABASE_URL="postgresql://partpal:password@localhost:5432/partpal?schema=public&connection_limit=10&pool_timeout=20"
```

#### Connection String Parameters

- `connection_limit`: Maximum number of connections (default: num_cpus * 2 + 1)
- `pool_timeout`: Connection pool timeout in seconds (default: 10)
- `connect_timeout`: Database connection timeout in seconds (default: 5)

#### Recommended Settings by Environment

**Development:**
```env
DATABASE_URL="postgresql://partpal:password@localhost:5432/partpal?schema=public&connection_limit=5&pool_timeout=10"
```

**Staging:**
```env
DATABASE_URL="postgresql://partpal:password@db.staging:5432/partpal?schema=public&connection_limit=20&pool_timeout=20&connect_timeout=10"
```

**Production:**
```env
DATABASE_URL="postgresql://partpal:password@db.production:5432/partpal?schema=public&connection_limit=50&pool_timeout=30&connect_timeout=5"
```

### Option 2: PgBouncer (Recommended for Production)

PgBouncer is a lightweight connection pooler for PostgreSQL.

#### Installation

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install pgbouncer

# Verify installation
pgbouncer --version
```

#### Configuration

Create/edit `/etc/pgbouncer/pgbouncer.ini`:

```ini
[databases]
partpal = host=localhost port=5432 dbname=partpal

[pgbouncer]
# Connection settings
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

# Pool mode
# - session: Server connection is released when client disconnects
# - transaction: Server connection is released when transaction completes (RECOMMENDED)
# - statement: Server connection is released after each statement
pool_mode = transaction

# Connection limits
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 10
reserve_pool_size = 5
reserve_pool_timeout = 3
max_db_connections = 50
max_user_connections = 50

# Timeouts
server_idle_timeout = 600
server_lifetime = 3600
server_connect_timeout = 15
query_timeout = 0
query_wait_timeout = 120
client_idle_timeout = 0
idle_transaction_timeout = 0

# Logging
admin_users = postgres
stats_users = stats, postgres
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1

# Performance
ignore_startup_parameters = extra_float_digits

# TLS/SSL (uncomment for production)
# client_tls_sslmode = require
# client_tls_key_file = /etc/ssl/private/pgbouncer.key
# client_tls_cert_file = /etc/ssl/certs/pgbouncer.crt
```

#### User Authentication

Create `/etc/pgbouncer/userlist.txt`:

```
"partpal" "md5<md5_hash_of_password>"
```

Generate MD5 hash:

```bash
echo -n "passwordpartpal" | md5sum
# Output: <hash>
# Add to userlist.txt: "partpal" "md5<hash>"
```

Or use plain text (less secure):

```
"partpal" "your_password"
```

#### Start PgBouncer

```bash
# Start service
sudo systemctl start pgbouncer
sudo systemctl enable pgbouncer

# Check status
sudo systemctl status pgbouncer

# View logs
sudo journalctl -u pgbouncer -f
```

#### Update Application Connection String

```env
# Connect through PgBouncer (port 6432 instead of 5432)
DATABASE_URL="postgresql://partpal:password@localhost:6432/partpal?schema=public"
```

#### PgBouncer Admin Commands

Connect to PgBouncer admin console:

```bash
psql -h localhost -p 6432 -U pgbouncer pgbouncer
```

Useful commands:

```sql
-- Show pool status
SHOW POOLS;

-- Show client connections
SHOW CLIENTS;

-- Show server connections
SHOW SERVERS;

-- Show statistics
SHOW STATS;

-- Reload configuration
RELOAD;

-- Pause all queries
PAUSE;

-- Resume queries
RESUME;

-- Disconnect all clients
SHUTDOWN;
```

### Option 3: Prisma Accelerate (Cloud-based)

Prisma Accelerate provides global database caching and connection pooling.

```env
# Prisma Accelerate connection string
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=<your_api_key>"
```

## Monitoring Connection Pool

### Using PostgreSQL

```sql
-- View active connections
SELECT
  count(*),
  state,
  usename,
  application_name
FROM pg_stat_activity
WHERE datname = 'partpal'
GROUP BY state, usename, application_name;

-- Maximum connections allowed
SHOW max_connections;

-- Current number of connections
SELECT count(*) FROM pg_stat_activity;
```

### Using PgBouncer Stats

```sql
-- Connect to PgBouncer admin
psql -h localhost -p 6432 -U pgbouncer pgbouncer

-- Show pool statistics
SHOW POOLS;
SHOW STATS;
```

### Application-level Monitoring

Create a monitoring script `/home/partpal/scripts/monitor-connections.sh`:

```bash
#!/bin/bash

while true; do
  echo "=== $(date) ==="

  # PostgreSQL connections
  echo "PostgreSQL Connections:"
  psql -U partpal -d partpal -c "SELECT count(*), state FROM pg_stat_activity WHERE datname = 'partpal' GROUP BY state;"

  # PgBouncer pools (if using)
  echo -e "\nPgBouncer Pools:"
  psql -h localhost -p 6432 -U pgbouncer pgbouncer -c "SHOW POOLS;" 2>/dev/null || echo "PgBouncer not available"

  echo ""
  sleep 10
done
```

## Best Practices

### Connection Pool Sizing

**Formula:** `connections = ((core_count * 2) + effective_spindle_count)`

For a 4-core system with SSD storage:
- Minimum: `(4 * 2) + 1 = 9` connections
- Recommended: 10-25 connections per application instance

### Environment-specific Settings

| Environment | Max Client Connections | Pool Size | Timeout |
|-------------|------------------------|-----------|---------|
| Development | 10                     | 5         | 10s     |
| Staging     | 100                    | 20        | 20s     |
| Production  | 1000                   | 50        | 30s     |

### Recommendations

1. **Use transaction pooling** in PgBouncer for best performance
2. **Set connection limits** based on your PostgreSQL server capacity
3. **Monitor pool exhaustion** and adjust sizes accordingly
4. **Use SSL/TLS** for production database connections
5. **Implement connection retry logic** in your application
6. **Set appropriate timeouts** to prevent hung connections
7. **Use read replicas** for read-heavy workloads
8. **Enable connection pooling metrics** for monitoring

## Troubleshooting

### Connection Pool Exhausted

```
Error: Can't reach database server
```

**Solutions:**
- Increase `connection_limit` or `default_pool_size`
- Check for connection leaks in application code
- Reduce query execution time
- Scale horizontally with read replicas

### Too Many Connections

```
FATAL: too many connections for role "partpal"
```

**Solutions:**
- Reduce `max_client_conn` in PgBouncer
- Increase PostgreSQL `max_connections`
- Implement connection pooling if not already using
- Close idle connections

### Connection Timeout

```
Error: Connect timeout
```

**Solutions:**
- Increase `connect_timeout` parameter
- Check network connectivity
- Verify PostgreSQL is accepting connections
- Check firewall rules

## Production Checklist

- [ ] PgBouncer installed and configured
- [ ] Connection pool size optimized for workload
- [ ] SSL/TLS enabled for database connections
- [ ] Connection monitoring set up
- [ ] Alerts configured for pool exhaustion
- [ ] Connection retry logic implemented
- [ ] Load testing performed
- [ ] Backup pooler configuration documented
- [ ] Disaster recovery plan includes pooler setup

## References

- [PgBouncer Documentation](https://www.pgbouncer.org/usage.html)
- [PostgreSQL Connection Pooling](https://www.postgresql.org/docs/current/runtime-config-connection.html)
- [Prisma Connection Management](https://www.prisma.io/docs/concepts/components/prisma-client/connection-management)
