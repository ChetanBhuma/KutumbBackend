# Quick Guide: Import Supabase Backup to Neon

You have a **backup.sql** file ready to import! Here are your options:

## Option 1: Direct psql Import (Recommended)

**Using PowerShell:**
```powershell
cd backend
$env:PGPASSWORD="npg_G8L2pPUbKxlZ"
psql "postgresql://neondb_owner:npg_G8L2pPUbKxlZ@ep-late-surf-a1t7e7et.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" -f ..\backup.sql
```

**Using Command Prompt:**
```cmd
cd backend
set PGPASSWORD=npg_G8L2pPUbKxlZ
psql "postgresql://neondb_owner:npg_G8L2pPUbKxlZ@ep-late-surf-a1t7e7et.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" -f ..\backup.sql
```

## Option 2: Use Our Import Scripts

**PowerShell Script:**
```powershell
cd backend\scripts
.\import-backup-to-neon.ps1
```

**Batch Script:**
```cmd
cd backend\scripts
import-backup-to-neon.bat
```

## Option 3: Using pgAdmin (GUI)

1. Open **pgAdmin**
2. Add new server with Neon credentials:
   - Host: `ep-late-surf-a1t7e7et.ap-southeast-1.aws.neon.tech`
   - Port: `5432`
   - Database: `neondb`
   - Username: `neondb_owner`
   - Password: `npg_G8L2pPUbKxlZ`
3. Right-click on `neondb` → **Restore**
4. Select `backup.sql` file
5. Click **Restore**

## What to Expect

The import will:
- ✅ Import all your application data (users, citizens, visits, etc.)
- ⚠️ Show some warnings/errors for Supabase-specific schemas (auth, storage, etc.) - **this is normal**
- ✅ Take 2-5 minutes depending on data size

## After Import

1. **Verify the import:**
   ```bash
   # Switch to Neon environment
   copy backend\.env.production backend\.env

   # Open Prisma Studio
   cd backend
   npx prisma studio
   ```

2. **Check record counts:**
   ```bash
   cd backend
   npx ts-node scripts/test-db-connection.ts
   ```

3. **Start your application:**
   ```bash
   cd backend
   npm run start
   ```

## Troubleshooting

**If psql is not installed:**
- Download PostgreSQL from: https://www.postgresql.org/download/windows/
- Or install via Chocolatey: `choco install postgresql`

**If you get authentication errors:**
- Verify your Neon database is active in the dashboard
- Check that the connection string is correct in `.env.production`

**If you see schema errors:**
- These are expected for Supabase auth/storage schemas
- As long as public schema data imports, you're good!

## Files Created

- `scripts/import-backup-to-neon.ps1` - PowerShell import script
- `scripts/import-backup-to-neon.bat` - Batch import script
- This guide: `IMPORT_GUIDE.md`
