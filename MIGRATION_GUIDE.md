# Database Migration Guide

## Overview

This project uses Prisma for database migrations, providing version control for your database schema.

## Prerequisites

- PostgreSQL 14+ installed
- PostGIS extension enabled
- Database created

## Initial Setup

### 1. Create Database

```bash
# Create database
createdb delivery_db

# Connect to database
psql delivery_db
```

### 2. Enable PostGIS Extension

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify PostGIS is installed
SELECT PostGIS_Version();
```

### 3. Configure Database URL

Update `.env` file:
```
DATABASE_URL="postgresql://username:password@localhost:5432/delivery_db?schema=public"
```

## Running Migrations

### Development Mode

```bash
# Run migrations and create database tables
npm run prisma:migrate

# This will:
# 1. Create migration files in prisma/migrations/
# 2. Apply migrations to database
# 3. Generate Prisma Client
```

### Production Mode

```bash
# Deploy migrations without prompts
npm run prisma:migrate:deploy
```

## Common Migration Tasks

### Create New Migration

```bash
# Make changes to prisma/schema.prisma
# Then create migration:
npx prisma migrate dev --name add_new_feature
```

### View Migration Status

```bash
npx prisma migrate status
```

### Reset Database (CAUTION: Deletes all data)

```bash
npm run prisma:reset

# Or with Prisma CLI:
npx prisma migrate reset
```

### Generate Prisma Client Only

```bash
npm run prisma:generate
```

## Migration Best Practices

### 1. Always Review Generated SQL

Before applying, check the migration file:
```bash
cat prisma/migrations/<timestamp>_<name>/migration.sql
```

### 2. Backup Before Production Migrations

```bash
# Backup database
pg_dump delivery_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migration
npm run prisma:migrate:deploy
```

### 3. Test Migrations Locally First

Always test migrations in development before production:
```bash
# Development
npm run prisma:migrate

# Review changes
# Test application

# Production (only after testing)
npm run prisma:migrate:deploy
```

### 4. Handle Failed Migrations

If a migration fails:

```bash
# Check status
npx prisma migrate status

# Mark as rolled back
npx prisma migrate resolve --rolled-back <migration_name>

# Fix the issue and try again
npx prisma migrate dev
```

## PostGIS-Specific Migrations

### Adding Spatial Columns

When adding location columns, the migration should include:

```sql
-- Add columns
ALTER TABLE restaurants ADD COLUMN latitude DECIMAL(10,8);
ALTER TABLE restaurants ADD COLUMN longitude DECIMAL(11,8);
ALTER TABLE restaurants ADD COLUMN location geometry(Point, 4326);

-- Create spatial index
CREATE INDEX idx_restaurants_location ON restaurants USING GIST(location);

-- Update existing records (if needed)
UPDATE restaurants
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
```

### Querying Spatial Data

After migrations, you can query spatial data:

```sql
-- Find restaurants within 10km
SELECT id, name,
  ST_Distance(
    location::geography,
    ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)::geography
  ) / 1000 as distance_km
FROM restaurants
WHERE ST_DWithin(
  location::geography,
  ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)::geography,
  10000
)
ORDER BY distance_km;
```

## Troubleshooting

### Issue: PostGIS Extension Not Found

```bash
# Install PostGIS (Ubuntu/Debian)
sudo apt-get install postgis postgresql-14-postgis-3

# Install PostGIS (macOS)
brew install postgis
```

### Issue: Migration Conflicts

```bash
# If you have uncommitted migrations
npx prisma migrate resolve --applied <migration_name>

# Or start fresh (CAUTION)
npx prisma migrate reset
```

### Issue: Out of Sync

```bash
# Pull the schema from database
npx prisma db pull

# Generate Prisma Client
npx prisma generate
```

### Issue: Migration Baseline

For existing databases:

```bash
# Create initial migration without applying
npx prisma migrate dev --create-only --name init

# Mark as applied
npx prisma migrate resolve --applied init
```

## Seeding Database

After running migrations, seed the database:

```bash
npm run prisma:seed
```

This will create:
- Admin user
- Restaurant owner
- Sample restaurant with menu
- Customer and driver accounts

## Schema Changes Workflow

1. **Modify Schema** - Edit `prisma/schema.prisma`
2. **Create Migration** - `npm run prisma:migrate`
3. **Review SQL** - Check generated migration file
4. **Test Locally** - Verify changes work
5. **Commit** - Add migration files to git
6. **Deploy** - Run on production with `prisma:migrate:deploy`

## Migration Versioning

Migrations are stored in `prisma/migrations/` directory:
```
prisma/migrations/
  20240101120000_init/
    migration.sql
  20240102153000_add_promotions/
    migration.sql
```

Each migration is:
- Timestamped
- Named descriptively
- Version controlled in git
- Applied sequentially

## Rollback Strategy

Prisma doesn't have built-in rollback. For rollbacks:

### Option 1: Restore from Backup
```bash
psql delivery_db < backup_file.sql
```

### Option 2: Create Reverse Migration
```sql
-- If you added a column, create migration to remove it
ALTER TABLE restaurants DROP COLUMN new_column;
```

### Option 3: Reset and Re-apply
```bash
# CAUTION: This deletes all data
npx prisma migrate reset
npx prisma migrate deploy
```

## Production Checklist

Before deploying migrations to production:

- [ ] Migrations tested in development
- [ ] Database backed up
- [ ] Schema changes reviewed
- [ ] Application code updated
- [ ] Rollback plan prepared
- [ ] Downtime window scheduled (if needed)
- [ ] Team notified
- [ ] Monitoring enabled

## Additional Resources

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Support

For migration issues:
1. Check logs in `logs/` directory
2. Review Prisma migration status
3. Consult troubleshooting section
4. Open an issue on GitHub
