# Direct Database Sync: Supabase -> Neon
# Streams data directly without intermediate files

$PG_DUMP = "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe"
$PSQL = "C:\Program Files\PostgreSQL\17\bin\psql.exe"

# Supabase Source (Development)
$SOURCE_DB = "postgresql://postgres.rydijhfvfiakdxjayktu:kutumb%402026@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# Neon Destination (Production)
$TARGET_DB = "postgresql://neondb_owner:npg_G8L2pPUbKxlZ@ep-late-surf-a1t7e7et.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

Write-Host "🚀 Starting Direct Sync: Supabase -> Neon" -ForegroundColor Cyan
Write-Host "   Source: Supabase" -ForegroundColor Gray
Write-Host "   Target: Neon" -ForegroundColor Gray
Write-Host ""

if (-not (Test-Path $PG_DUMP)) {
    Write-Host "❌ pg_dump.exe not found!" -ForegroundColor Red
    exit 1
}

Write-Host "⏳ Streaming data..." -ForegroundColor Yellow

# Use cmd /c to handle the pipe correctly
# --data-only: Only export data, not schema (schema assumed to exist)
# --no-owner: Skip ownership commands (avoids errors on Neon)
cmd /c "`"$PG_DUMP`" --no-owner --no-acl --data-only --schema=public `"$SOURCE_DB`" | `"$PSQL`" `"$TARGET_DB`""

Write-Host ""
Write-Host "✅ Sync operation complete." -ForegroundColor Green
Write-Host "   (Duplicate key errors are normal if data already exists)" -ForegroundColor Gray
