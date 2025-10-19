#!/usr/bin/env node

/**
 * SQLite to PostgreSQL Data Migration Script
 *
 * This script migrates data from an existing SQLite database to PostgreSQL.
 * It handles data type conversions and maintains referential integrity.
 *
 * Usage:
 *   SQLITE_URL="file:./prisma/dev.db" POSTGRES_URL="postgresql://..." node scripts/migrate-sqlite-to-postgres.js
 */

const { PrismaClient } = require('@prisma/client');

// Configuration
const SQLITE_URL = process.env.SQLITE_URL || 'file:./prisma/dev.db';
const POSTGRES_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const BATCH_SIZE = 100;

if (!POSTGRES_URL || POSTGRES_URL.includes('sqlite')) {
  console.error('Error: Please set POSTGRES_URL environment variable');
  console.error('Example: POSTGRES_URL="postgresql://user:pass@localhost:5432/partpal"');
  process.exit(1);
}

// Create two Prisma clients
const sqlite = new PrismaClient({
  datasources: {
    db: {
      url: SQLITE_URL,
    },
  },
});

const postgres = new PrismaClient({
  datasources: {
    db: {
      url: POSTGRES_URL,
    },
  },
});

/**
 * Convert JSON strings to objects for PostgreSQL
 */
function convertJsonFields(data, jsonFields) {
  const converted = { ...data };
  for (const field of jsonFields) {
    if (converted[field] && typeof converted[field] === 'string') {
      try {
        converted[field] = JSON.parse(converted[field]);
      } catch (e) {
        console.warn(`Warning: Failed to parse JSON field ${field}:`, e.message);
        converted[field] = null;
      }
    }
  }
  return converted;
}

/**
 * Migrate a single table
 */
async function migrateTable(tableName, jsonFields = []) {
  console.log(`\nMigrating ${tableName}...`);

  try {
    const sourceData = await sqlite[tableName].findMany();
    console.log(`  Found ${sourceData.length} records in source database`);

    if (sourceData.length === 0) {
      console.log(`  No data to migrate for ${tableName}`);
      return;
    }

    // Migrate in batches
    let migrated = 0;
    for (let i = 0; i < sourceData.length; i += BATCH_SIZE) {
      const batch = sourceData.slice(i, i + BATCH_SIZE);

      for (const record of batch) {
        // Convert JSON fields
        const convertedRecord = convertJsonFields(record, jsonFields);

        try {
          await postgres[tableName].create({
            data: convertedRecord,
          });
          migrated++;
        } catch (error) {
          console.error(`  Error migrating record ${record.id}:`, error.message);

          // Try update if create fails (record might already exist)
          try {
            await postgres[tableName].update({
              where: { id: record.id },
              data: convertedRecord,
            });
            migrated++;
            console.log(`  Updated existing record ${record.id}`);
          } catch (updateError) {
            console.error(`  Failed to update record ${record.id}:`, updateError.message);
          }
        }
      }

      console.log(`  Progress: ${Math.min(i + BATCH_SIZE, sourceData.length)}/${sourceData.length}`);
    }

    console.log(`  Successfully migrated ${migrated}/${sourceData.length} records`);
  } catch (error) {
    console.error(`  Error migrating ${tableName}:`, error.message);
    throw error;
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('SQLite to PostgreSQL Data Migration');
  console.log('='.repeat(60));
  console.log(`Source: ${SQLITE_URL}`);
  console.log(`Target: ${POSTGRES_URL.replace(/:[^:@]+@/, ':****@')}`);
  console.log('='.repeat(60));

  try {
    // Test connections
    console.log('\nTesting database connections...');
    await sqlite.$connect();
    console.log('  SQLite: Connected');

    await postgres.$connect();
    console.log('  PostgreSQL: Connected');

    // Verify PostgreSQL database is empty or ask for confirmation
    const userCount = await postgres.user.count();
    if (userCount > 0) {
      console.log('\nWarning: PostgreSQL database is not empty!');
      console.log(`Found ${userCount} users. Migration will attempt to update existing records.`);
      console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Migrate tables in dependency order
    console.log('\nStarting migration...\n');

    // 1. Categories (no dependencies)
    await migrateTable('category');

    // 2. Users (no dependencies)
    await migrateTable('user');

    // 3. Refresh Tokens (depends on Users)
    await migrateTable('refreshToken');

    // 4. Sellers (depends on Users)
    await migrateTable('seller', ['businessHours']); // businessHours is JSON

    // 5. Vehicles (depends on Sellers)
    await migrateTable('vehicle');

    // 6. Parts (depends on Vehicles, Sellers, Categories)
    await migrateTable('part', ['images']); // images is JSON array

    // 7. Analytics Events
    await migrateTable('analyticsEvent', ['metadata']); // metadata is JSON

    // 8. Activity Logs
    await migrateTable('activityLog', ['metadata']); // metadata is JSON

    console.log('\n' + '='.repeat(60));
    console.log('Migration completed successfully!');
    console.log('='.repeat(60));

    // Verify migration
    console.log('\nVerifying migration...');
    const stats = {
      users: await postgres.user.count(),
      sellers: await postgres.seller.count(),
      vehicles: await postgres.vehicle.count(),
      parts: await postgres.part.count(),
      categories: await postgres.category.count(),
    };

    console.log('\nFinal record counts in PostgreSQL:');
    console.log(`  Users: ${stats.users}`);
    console.log(`  Sellers: ${stats.sellers}`);
    console.log(`  Vehicles: ${stats.vehicles}`);
    console.log(`  Parts: ${stats.parts}`);
    console.log(`  Categories: ${stats.categories}`);

  } catch (error) {
    console.error('\nMigration failed:', error);
    process.exit(1);
  } finally {
    await sqlite.$disconnect();
    await postgres.$disconnect();
  }
}

// Run migration
main()
  .then(() => {
    console.log('\nMigration script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nFatal error:', error);
    process.exit(1);
  });
