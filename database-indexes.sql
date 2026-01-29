-- Database Indexing Recommendations for Performance
-- Run these migrations to optimize query performance

-- ============================================
-- SENIOR CITIZENS TABLE INDEXES
-- ============================================

-- Index for searching by name (frequently used in search)
CREATE INDEX IF NOT EXISTS idx_senior_citizens_name ON "SeniorCitizen"(fullName);

-- Index for filtering by vulnerability level
CREATE INDEX IF NOT EXISTS idx_senior_citizens_vulnerability ON "SeniorCitizen"(vulnerabilityLevel);

-- Index for filtering by verification status
CREATE INDEX IF NOT EXISTS idx_senior_citizens_verification ON "SeniorCitizen"(verificationStatus);

-- Index for beat assignment queries
CREATE INDEX IF NOT EXISTS idx_senior_citizens_beat ON "SeniorCitizen"(beatId);

-- Index for police station queries
CREATE INDEX IF NOT EXISTS idx_senior_citizens_police_station ON "SeniorCitizen"(policeStationId);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_senior_citizens_filter ON "SeniorCitizen"(vulnerabilityLevel, verificationStatus, beatId);

-- Index for mobile number lookup (unique searches)
CREATE INDEX IF NOT EXISTS idx_senior_citizens_mobile ON "SeniorCitizen"(mobileNumber);

-- Index for Aadhaar lookup
CREATE INDEX IF NOT EXISTS idx_senior_citizens_aadhaar ON "SeniorCitizen"(aadhaarNumber);


-- ============================================
-- VISITS TABLE INDEXES
-- ============================================

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_visits_status ON "Visit"(status);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_visits_date ON "Visit"(scheduledDate);

-- Index for officer assignment
CREATE INDEX IF NOT EXISTS idx_visits_officer ON "Visit"(assignedOfficerId);

-- Index for citizen visits
CREATE INDEX IF NOT EXISTS idx_visits_citizen ON "Visit"(citizenId);

-- Composite index for officer's scheduled visits
CREATE INDEX IF NOT EXISTS idx_visits_officer_date ON "Visit"(assignedOfficerId, scheduledDate, status);

-- Composite index for citizen visit history
CREATE INDEX IF NOT EXISTS idx_visits_citizen_date ON "Visit"(citizenId, scheduledDate DESC);


-- ============================================
-- SOS ALERTS TABLE INDEXES
-- ============================================

-- Index for active alerts (most common query)
CREATE INDEX IF NOT EXISTS idx_sos_status ON "SOSAlert"(status);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_sos_created ON "SOSAlert"(createdAt DESC);

-- Index for citizen SOS history
CREATE INDEX IF NOT EXISTS idx_sos_citizen ON "SOSAlert"(citizenId);

-- Index for location-based queries (if using PostGIS)
-- CREATE INDEX IF NOT EXISTS idx_sos_location ON "SOSAlert" USING GIST(location);

-- Composite index for active alerts by time
CREATE INDEX IF NOT EXISTS idx_sos_active ON "SOSAlert"(status, createdAt DESC);


-- ============================================
-- USERS TABLE INDEXES
-- ============================================

-- Index for email login
CREATE INDEX IF NOT EXISTS idx_users_email ON "User"(email);

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON "User"(role);

-- Index for beat assignment
CREATE INDEX IF NOT EXISTS idx_users_beat ON "User"(beatId);

-- Composite index for officer queries
CREATE INDEX IF NOT EXISTS idx_users_officer ON "User"(role, isActive, beatId);


-- ============================================
-- BEATS TABLE INDEXES
-- ============================================

-- Index for police station lookup
CREATE INDEX IF NOT EXISTS idx_beats_station ON "Beat"(policeStationId);

-- Index for beat number search
CREATE INDEX IF NOT EXISTS idx_beats_number ON "Beat"(beatNumber);


-- ============================================
-- FAMILY MEMBERS TABLE INDEXES
-- ============================================

-- Index for citizen family members
CREATE INDEX IF NOT EXISTS idx_family_citizen ON "FamilyMember"(seniorCitizenId);


-- ============================================
-- NOTIFICATIONS TABLE INDEXES
-- ============================================

-- Index for recipient queries
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON "Notification"(recipientId);

-- Index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_read ON "Notification"(isRead, recipientId);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_notifications_created ON "Notification"(createdAt DESC);


-- ============================================
-- PERFORMANCE ANALYSIS QUERIES
-- ============================================

-- Check index usage (PostgreSQL specific)
-- Run this to see which indexes are being used
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
*/

-- Find missing indexes (PostgreSQL specific)
/*
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    seq_tup_read / seq_scan as avg_seq_tup_read
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC
LIMIT 25;
*/

-- Table sizes
/*
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
*/
