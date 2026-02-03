# Database Migration Guide

## Overview

This project is configured to support two database environments:
- **Production**: Neon PostgreSQL Database
- **Development**: Supabase PostgreSQL Database

## Environment Files

### `.env.production`
Contains Neon database credentials for production deployment.

```bash
DATABASE_URL="postgresql://neondb_owner:npg_G8L2pPUbKxlZ@ep-late-surf-a1t7e7et-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://neondb_owner:npg_G8L2pPUbKxlZ@ep-late-surf-a1t7e7et.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

### `.env.development`
Contains Supabase database credentials for local development.

```bash
DATABASE_URL="postgresql://postgres.rydijhfvfiakdxjayktu:kutumb%402026@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.rydijhfvfiakdxjayktu:kutumb%402026@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

### `.env`
Default environment file. Currently points to Supabase for development.

## Switching Between Environments

### Option 1: Rename Environment Files
```bash
# For production
cp .env.production .env

# For development
cp .env.development .env
```

### Option 2: Use Environment Variables
```bash
# For production
export $(cat .env.production | xargs)

# For development
export $(cat .env.development | xargs)
```

### Option 3: Use dotenv-cli
```bash
# Install dotenv-cli
npm install -g dotenv-cli

# Run commands with specific env file
dotenv -e .env.production -- npm run start
dotenv -e .env.development -- npm run dev
```

## Database Migration Steps

### Setup Neon Production Database

1. **Run Prisma Migrations on Neon**
   ```bash
   # Switch to production environment
   cp .env.production .env

   # Generate Prisma client
   npx prisma generate

   # Deploy migrations to Neon
   npx prisma migrate deploy

   # Verify schema
   npx prisma studio
   ```

2. **Export Data from Supabase** (if Supabase is accessible)
   ```bash
   # Switch to development environment
   cp .env.development .env

   # Run export script
   npm run db:export

   # Backup file will be saved to: backup/supabase-export-[timestamp].json
   ```

3. **Import Data to Neon**
   ```bash
   # Switch to production environment
   cp .env.production .env

   # Run import script
   npm run db:import

   # Or specify a specific backup file
   npm run db:import backup/supabase-export-2026-02-02.json
   ```

### Alternative: Using pg_dump and pg_restore

If the Prisma export scripts encounter issues, you can use PostgreSQL native tools:

```bash
# Export from Supabase
pg_dump "postgresql://postgres.rydijhfvfiakdxjayktu:kutumb@2026@aws-1-ap-south-1.pooler.supabase.com:5432/postgres" > backup/supabase_dump.sql

# Import to Neon
psql "postgresql://neondb_owner:npg_G8L2pPUbKxlZ@ep-late-surf-a1t7e7et.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" < backup/supabase_dump.sql
```

## NPM Scripts

- `npm run db:export` - Export data from currently configured database
- `npm run db:import` - Import data to currently configured database
- `npm run prisma:prod` - Run Prisma commands against production (requires dotenv-cli)
- `npm run prisma:dev` - Run Prisma commands against development (requires dotenv-cli)

## Troubleshooting

### Circuit Breaker Errors (Supabase)

If you encounter "Circuit breaker open" errors when connecting to Supabase:
- This indicates Supabase pooler is overloaded or unavailable
- Try using DIRECT_URL instead of DATABASE_URL
- Wait a few minutes and retry
- Use pg_dump as an alternative export method

### Connection Timeout

- Verify firewall settings allow outbound PostgreSQL connections
- Check if database credentials are correct
- Ensure database is not paused (common with Supabase free tier)

### Migration Errors on Neon

- Ensure DATABASE_URL includes `sslmode=require&channel_binding=require`
- Verify Neon database is active and not suspended
- Check Neon dashboard for connection limits

## Production Deployment

When deploying to production (e.g., Vercel):

1. **Set Environment Variables**
   ```
   In Vercel Dashboard > Settings > Environment Variables:
   DATABASE_URL=postgresql://neondb_owner:npg_G8L2pPUbKxlZ@ep-late-surf-a1t7e7et-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   DIRECT_URL=postgresql://neondb_owner:npg_G8L2pPUbKxlZ@ep-late-surf-a1t7e7et.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```

2. **Ensure Prisma Client Generation**
   - The `postinstall` script in package.json runs `prisma generate` automatically
   - Build command should include: `npx prisma generate && npx tsc`

## Rollback Plan

If migration to Neon fails:

1. Keep `.env.development` with Supabase credentials
2. Switch back to Supabase by renaming `.env.development` to `.env`
3. Restart application
4. Investigate Neon issues before retrying

## Security Notes

- Never commit `.env` files to version control
- Rotate database passwords regularly
- Use read-only credentials for analytics/reporting connections
- Enable SSL mode for all production connections
