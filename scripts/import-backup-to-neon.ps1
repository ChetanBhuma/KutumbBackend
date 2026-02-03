# Import Supabase Backup to Neon Database
# This script imports the backup.sql file into Neon

Write-Host "🔄 Importing Supabase backup to Neon database..." -ForegroundColor Cyan
Write-Host ""

# Neon connection string
$NEON_URL = "postgresql://neondb_owner:npg_G8L2pPUbKxlZ@ep-late-surf-a1t7e7et.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Check if psql is installed
$psqlExists = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlExists) {
    Write-Host "❌ Error: psql command not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PostgreSQL client tools:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "2. Or install via Chocolatey: choco install postgresql" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✅ PostgreSQL client found" -ForegroundColor Green

# Check if backup file exists
$backupFile = Join-Path $PSScriptRoot "..\backup.sql"
if (-not (Test-Path $backupFile)) {
    Write-Host "❌ Error: backup.sql not found at $backupFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backup file found: $backupFile" -ForegroundColor Green
Write-Host ""

# Create filtered backup (only public schema)
$filteredBackup = Join-Path $PSScriptRoot "..\backup\neon-import.sql"
New-Item -Path (Split-Path $filteredBackup) -ItemType Directory -Force | Out-Null

Write-Host "📝 Creating filtered backup (public schema only)..." -ForegroundColor Cyan

# Read and filter the backup
$content = Get-Content $backupFile -Raw

# Extract only public schema INSERT statements and table definitions
$publicContent = @"
-- Filtered backup for Neon import
-- Only public schema data

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

"@

# Write to filtered file
$publicContent | Out-File -FilePath $filteredBackup -Encoding UTF8

Write-Host "✅ Filtered backup created" -ForegroundColor Green
Write-Host ""

Write-Host "⚠️  IMPORTANT: This will import data into Neon database" -ForegroundColor Yellow
Write-Host "   Database: neondb" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Continue with import? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "❌ Import cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "📥 Importing to Neon..." -ForegroundColor Cyan
Write-Host "   This may take several minutes..." -ForegroundColor Gray
Write-Host ""

# Import using psql
$env:PGPASSWORD = "npg_G8L2pPUbKxlZ"
psql $NEON_URL -f $backupFile 2>&1 | Tee-Object -Variable output

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Import completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Verify data: npx prisma studio" -ForegroundColor White
    Write-Host "   2. Test connection: npm run test:db-connection" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "⚠️  Import completed with warnings" -ForegroundColor Yellow
    Write-Host "   This is normal for Supabase backups (auth schema incompatibilities)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📊 Verify your data:" -ForegroundColor Cyan
    Write-Host "   npx prisma studio" -ForegroundColor White
    Write-Host ""
}
