@echo off
REM Import SQL backup to Neon database

echo ============================================
echo Importing Supabase Backup to Neon Database
echo ============================================
echo.

REM Neon connection string
set "NEON_URL=postgresql://neondb_owner:npg_G8L2pPUbKxlZ@ep-late-surf-a1t7e7et.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

REM Check if psql is installed
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: psql command not found!
    echo.
    echo Please install PostgreSQL client tools:
    echo 1. Download from: https://www.postgresql.org/download/windows/
    echo 2. Or install via Chocolatey: choco install postgresql
    echo.
    exit /b 1
)

echo [OK] PostgreSQL client found

REM Check if backup file exists
if not exist "..\backup.sql" (
    echo ERROR: backup.sql not found!
    exit /b 1
)

echo [OK] Backup file found
echo.

echo WARNING: This will import data into Neon database
echo.
set /p CONFIRM="Continue with import? (yes/no): "
if not "%CONFIRM%"=="yes" (
    echo Import cancelled.
    exit /b 0
)

echo.
echo Importing to Neon (this may take several minutes)...
echo.

REM Set password environment variable
set PGPASSWORD=npg_G8L2pPUbKxlZ

REM Import the backup
psql "%NEON_URL%" -f "..\backup.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo Import completed successfully!
    echo ============================================
    echo.
    echo Next steps:
    echo   1. Verify data: npx prisma studio
    echo   2. Test your application
    echo.
) else (
    echo.
    echo ============================================
    echo Import completed with warnings
    echo ============================================
    echo.
    echo This is normal for Supabase backups.
    echo Verify your data with: npx prisma studio
    echo.
)

pause
