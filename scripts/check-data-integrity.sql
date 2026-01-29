-- Phase 3: Data Integrity & Database Audit
-- SQL queries to check for orphaned records and data integrity issues

-- 1. Find orphaned Visit records (visits without valid senior citizen)
SELECT 
    v.id, 
    v."seniorCitizenId", 
    v.status, 
    v."scheduledDate"
FROM "Visit" v
LEFT JOIN "SeniorCitizen" sc ON v."seniorCitizenId" = sc.id
WHERE sc.id IS NULL;

-- 2. Find orphaned Visit records (visits without valid officer)
SELECT 
    v.id, 
    v."officerId", 
    v.status, 
    v."scheduledDate"
FROM "Visit" v
LEFT JOIN "BeatOfficer" bo ON v."officerId" = bo.id
WHERE bo.id IS NULL;

-- 3. Find SeniorCitizen records without police station
SELECT 
    sc.id,
    sc."fullName",
    sc."policeStationId",
    sc."beatId"
FROM "SeniorCitizen" sc
WHERE sc."policeStationId" IS NOT NULL 
  AND sc."policeStationId" NOT IN (SELECT id FROM "PoliceStation");

-- 4. Find SeniorCitizen records without beat
SELECT 
    sc.id,
    sc."fullName",
    sc."beatId",
    sc."policeStationId"
FROM "SeniorCitizen" sc
WHERE sc."beatId" IS NOT NULL 
  AND sc."beatId" NOT IN (SELECT id FROM "Beat");

-- 5. Find SOS alerts for deleted citizens
SELECT 
    sos.id,
    sos."seniorCitizenId",
    sos.status,
    sos."createdAt"
FROM "SOSAlert" sos
LEFT JOIN "SeniorCitizen" sc ON sos."seniorCitizenId" = sc.id
WHERE sc.id IS NULL OR sc."isActive" = false;

-- 6. Find Documents for non-existent citizens
SELECT 
    d.id,
    d."seniorCitizenId",
    d."documentType",
    d."createdAt"
FROM "Document" d
LEFT JOIN "SeniorCitizen" sc ON d."seniorCitizenId" = sc.id
WHERE sc.id IS NULL;

-- 7. Check for duplicate Aadhaar numbers
SELECT 
    "aadhaarNumber",
    COUNT(*) as count
FROM "SeniorCitizen"
WHERE "aadhaarNumber" IS NOT NULL
  AND "isActive" = true
GROUP BY "aadhaarNumber"
HAVING COUNT(*) > 1;

-- 8. Check for duplicate mobile numbers in SeniorCitizen
SELECT 
    "mobileNumber",
    COUNT(*) as count
FROM "SeniorCitizen"
WHERE "isActive" = true
GROUP BY "mobileNumber"
HAVING COUNT(*) > 1;

-- 9. Check for citizens with invalid age (< 60)
SELECT 
    id,
    "fullName",
    "dateOfBirth",
    age
FROM "SeniorCitizen"
WHERE "isActive" = true
  AND age < 60;

-- 10. Find visits scheduled in the past but still SCHEDULED
SELECT 
    v.id,
    v."seniorCitizenId",
    v."officerId",
    v."scheduledDate",
    v.status
FROM "Visit" v
WHERE v.status = 'SCHEDULED'
  AND v."scheduledDate" < NOW() - INTERVAL '1 day';

-- 11. Check for missing indices (query performance analysis)
-- This query shows tables without indices on foreign keys
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 12. Check for NULL values in required fields
SELECT 
    id,
    "fullName",
    "mobileNumber",
    "permanentAddress"
FROM "SeniorCitizen"
WHERE 
    "fullName" IS NULL 
    OR "mobileNumber" IS NULL 
    OR "permanentAddress" IS NULL;

-- 13. Find emergency contacts for deleted citizens
SELECT 
    ec.id,
    ec."seniorCitizenId",
    ec.name,
    ec."mobileNumber"
FROM "EmergencyContact" ec
LEFT JOIN "SeniorCitizen" sc ON ec."seniorCitizenId" = sc.id
WHERE sc.id IS NULL OR sc."isActive" = false;

-- 14. Check enum consistency - Visit Status
SELECT DISTINCT status 
FROM "Visit"
WHERE status NOT IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- 15. Check enum consistency - Alert Status  
SELECT DISTINCT status
FROM "SOSAlert"
WHERE status NOT IN ('Active', 'Responded', 'Resolved', 'False_Alarm');

-- 16. Find verification requests for deleted citizens
SELECT 
    vr.id,
    vr."seniorCitizenId",
    vr.status
FROM "VerificationRequest" vr
LEFT JOIN "SeniorCitizen" sc ON vr."seniorCitizenId" = sc.id
WHERE sc.id IS NULL;

-- 17. Check for citizens with conflicting verification statuses
SELECT 
    sc.id,
    sc."fullName",
    sc."idVerificationStatus",
    COUNT(v.id) as pending_verifications
FROM "SeniorCitizen" sc
LEFT JOIN "VerificationRequest" vr ON vr."seniorCitizenId" = sc.id 
    AND vr.status = 'PENDING'
WHERE sc."idVerificationStatus" = 'Verified'
GROUP BY sc.id, sc."fullName", sc."idVerificationStatus"
HAVING COUNT(v.id) > 0;

-- 18. Database size and growth analysis
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;
