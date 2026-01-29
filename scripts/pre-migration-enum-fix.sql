-- Pre-migration: Update existing False_Alarm values to FalseAlarm
UPDATE "SOSAlert"
SET status = 'FalseAlarm'
WHERE status = 'False_Alarm';
