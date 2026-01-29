-- Rename the enum value directly in PostgreSQL
-- This avoids data loss warnings and allows data to fit the new schema
ALTER TYPE "AlertStatus" RENAME VALUE 'False_Alarm' TO 'FalseAlarm';
