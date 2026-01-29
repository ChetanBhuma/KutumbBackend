-- Complete Database Seed Script for Delhi Police Senior Citizen Portal
-- Run this in your PostgreSQL database

-- Clean existing data (in correct order to respect foreign keys)
TRUNCATE TABLE "SOSAlert", "Visit", "EmergencyContact", "FamilyMember", "CitizenAuth", "SeniorCitizen", "BeatOfficer", "Beat", "PoliceStation", "District" CASCADE;

-- Insert Districts
INSERT INTO "District" (id, name, code, range, area, headquarters, "isActive", "createdAt", "updatedAt") VALUES
('dist-1', 'Central Delhi', 'CD', 'Delhi Range', 'Central', 'Kamla Market', true, NOW(), NOW()),
('dist-2', 'South Delhi', 'SD', 'Delhi Range', 'South', 'Hauz Khas', true, NOW(), NOW()),
('dist-3', 'West Delhi', 'WD', 'Delhi Range', 'West', 'Rajouri Garden', true, NOW(), NOW());

-- Insert Police Stations
INSERT INTO "PoliceStation" (id, name, code, address, phone, "districtId", "isActive", "createdAt", "updatedAt") VALUES
('ps-1', 'Connaught Place PS', 'CP-PS', 'Connaught Place, New Delhi', '011-23412345', 'dist-1', true, NOW(), NOW()),
('ps-2', 'Saket PS', 'SKT-PS', 'Saket, New Delhi', '011-26512345', 'dist-2', true, NOW(), NOW()),
('ps-3', 'Rajouri Garden PS', 'RG-PS', 'Rajouri Garden, New Delhi', '011-25412345', 'dist-3', true, NOW(), NOW());

-- Insert Beats
INSERT INTO "Beat" (id, name, code, "policeStationId", boundaries, "isActive", "createdAt", "updatedAt") VALUES
('beat-1', 'CP Beat 1', 'CP-B1', 'ps-1', 'Inner Circle to Outer Circle', true, NOW(), NOW()),
('beat-2', 'Saket Beat 1', 'SKT-B1', 'ps-2', 'Saket Metro to Malviya Nagar', true, NOW(), NOW()),
('beat-3', 'Rajouri Beat 1', 'RG-B1', 'ps-3', 'Main Market to Tagore Garden', true, NOW(), NOW());

-- Insert Beat Officers
INSERT INTO "BeatOfficer" (id, name, rank, "badgeNumber", "mobileNumber", email, "policeStationId", "beatId", "isActive", "createdAt", "updatedAt") VALUES
('officer-1', 'Constable Rajesh Kumar', 'Constable', 'BADGE-001', '9876543210', 'rajesh.kumar@delhipolice.gov.in', 'ps-1', 'beat-1', true, NOW(), NOW()),
('officer-2', 'Constable Priya Sharma', 'Constable', 'BADGE-002', '9876543211', 'priya.sharma@delhipolice.gov.in', 'ps-2', 'beat-2', true, NOW(), NOW()),
('officer-3', 'Head Constable Vikram Singh', 'Head Constable', 'BADGE-003', '9876543212', 'vikram.singh@delhipolice.gov.in', 'ps-3', 'beat-3', true, NOW(), NOW());

-- Insert Senior Citizens
INSERT INTO "SeniorCitizen" (
    id, "fullName", "dateOfBirth", age, gender, "mobileNumber", 
    "permanentAddress", "presentAddress", "pinCode", "districtId", "policeStationId", "beatId",
    "vulnerabilityLevel", "idVerificationStatus", "maritalStatus", nationality, "languagesKnown",
    "consentDataUse", "consentToNotifyFamily", "consentShareHealth", "consentNotifications", 
    "consentServiceRequest", "registeredOnApp", "isActive", "gpsLatitude", "gpsLongitude",
    "createdAt", "updatedAt"
) VALUES
('citizen-1', 'Mr. Ram Prasad', '1950-03-15', 74, 'Male', '9876543230', 'A-12, Saket, New Delhi', 'A-12, Saket, New Delhi', '110017', 'dist-2', 'ps-2', 'beat-2', 'High', 'Approved', 'Married', 'Indian', ARRAY['Hindi', 'English'], true, true, true, true, true, true, true, 28.5245, 77.2067, NOW(), NOW()),
('citizen-2', 'Mrs. Kamla Devi', '1952-07-22', 72, 'Female', '9876543231', 'B-21, Greater Kailash, New Delhi', 'B-21, Greater Kailash, New Delhi', '110048', 'dist-2', 'ps-2', 'beat-2', 'Medium', 'Approved', 'Widowed', 'Indian', ARRAY['Hindi', 'English'], true, true, true, true, true, true, true, 28.5489, 77.2432, NOW(), NOW()),
('citizen-3', 'Mr. Suresh Kumar', '1948-11-05', 76, 'Male', '9876543232', 'H-88, Connaught Place, New Delhi', 'H-88, Connaught Place, New Delhi', '110001', 'dist-1', 'ps-1', 'beat-1', 'Low', 'Approved', 'Married', 'Indian', ARRAY['Hindi', 'English'], true, true, true, true, true, true, true, 28.6304, 77.2177, NOW(), NOW()),
('citizen-4', 'Mrs. Sunita Sharma', '1955-01-19', 69, 'Female', '9876543233', 'C-44, Rajouri Garden, New Delhi', 'C-44, Rajouri Garden, New Delhi', '110027', 'dist-3', 'ps-3', 'beat-3', 'Medium', 'Approved', 'Married', 'Indian', ARRAY['Hindi', 'English'], true, true, true, true, true, true, true, 28.6415, 77.1234, NOW(), NOW()),
('citizen-5', 'Mr. Harish Gupta', '1949-12-30', 74, 'Male', '9876543234', '56, Dwarka Sector 12, New Delhi', '56, Dwarka Sector 12, New Delhi', '110078', 'dist-3', 'ps-3', 'beat-3', 'High', 'Pending', 'Married', 'Indian', ARRAY['Hindi', 'English'], true, true, true, true, true, true, true, 28.5921, 77.0460, NOW(), NOW()),
('citizen-6', 'Mrs. Meera Joshi', '1958-07-26', 66, 'Female', '9876543235', 'Green Apartment, Saket, New Delhi', 'Green Apartment, Saket, New Delhi', '110017', 'dist-2', 'ps-2', 'beat-2', 'Low', 'Pending', 'Single', 'Indian', ARRAY['Hindi', 'English'], true, true, true, true, true, true, true, 28.5212, 77.2100, NOW(), NOW()),
('citizen-7', 'Mr. Baldev Singh', '1947-09-18', 77, 'Male', '9876543236', 'Punjabi Bagh, New Delhi', 'Punjabi Bagh, New Delhi', '110026', 'dist-3', 'ps-3', 'beat-3', 'Medium', 'Approved', 'Married', 'Indian', ARRAY['Hindi', 'Punjabi', 'English'], true, true, true, true, true, true, true, 28.6692, 77.1310, NOW(), NOW()),
('citizen-8', 'Mrs. Veena Nair', '1953-02-09', 71, 'Female', '9876543237', 'Lajpat Nagar, New Delhi', 'Lajpat Nagar, New Delhi', '110024', 'dist-2', 'ps-2', 'beat-2', 'High', 'Rejected', 'Married', 'Indian', ARRAY['Malayalam', 'Hindi', 'English'], true, true, true, true, true, true, true, 28.5677, 77.2431, NOW(), NOW()),
('citizen-9', 'Mr. Ashok Verma', '1951-06-14', 73, 'Male', '9876543238', 'Vasant Vihar, New Delhi', 'Vasant Vihar, New Delhi', '110057', 'dist-2', 'ps-2', 'beat-2', 'Low', 'Approved', 'Married', 'Indian', ARRAY['Hindi', 'English'], true, true, true, true, true, true, true, 28.5494, 77.1583, NOW(), NOW()),
('citizen-10', 'Mrs. Lakshmi Iyer', '1954-10-08', 70, 'Female', '9876543239', 'Karol Bagh, New Delhi', 'Karol Bagh, New Delhi', '110005', 'dist-1', 'ps-1', 'beat-1', 'Medium', 'Approved', 'Widowed', 'Indian', ARRAY['Tamil', 'Hindi', 'English'], true, true, true, true, true, true, true, 28.6519, 77.1909, NOW(), NOW());

-- Insert Emergency Contacts
INSERT INTO "EmergencyContact" (id, "seniorCitizenId", name, relation, "mobileNumber", address, "isPrimary", "createdAt") VALUES
('ec-1', 'citizen-1', 'Rohit Prasad', 'Son', '9876543240', 'Gurugram, Haryana', true, NOW()),
('ec-2', 'citizen-2', 'Shruti Malhotra', 'Daughter', '9876543241', 'Noida, UP', true, NOW()),
('ec-3', 'citizen-3', 'Sarita Kumar', 'Spouse', '9876543242', 'New Delhi', true, NOW()),
('ec-4', 'citizen-4', 'Neha Batra', 'Daughter', '9876543243', 'Gurugram, Haryana', true, NOW()),
('ec-5', 'citizen-5', 'Poonam Gupta', 'Spouse', '9876543244', 'New Delhi', true, NOW()),
('ec-6', 'citizen-6', 'Anil Mehra', 'Brother', '9876543245', 'Kanpur, UP', true, NOW()),
('ec-7', 'citizen-7', 'Karan Singh', 'Son', '9876543246', 'Chandigarh', true, NOW()),
('ec-8', 'citizen-8', 'Suresh Nair', 'Spouse', '9876543247', 'New Delhi', true, NOW()),
('ec-9', 'citizen-9', 'Priya Verma', 'Daughter', '9876543248', 'Mumbai', true, NOW()),
('ec-10', 'citizen-10', 'Ravi Iyer', 'Son', '9876543249', 'Bangalore', true, NOW());

-- Insert Visits (Past and Upcoming)
INSERT INTO "Visit" (id, "seniorCitizenId", "officerId", "policeStationId", "beatId", "visitType", "scheduledDate", "completedDate", status, duration, notes, "createdAt", "updatedAt") VALUES
-- Past visits (completed 7 days ago)
('visit-1', 'citizen-1', 'officer-2', 'ps-2', 'beat-2', 'Routine', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', 'Completed', 30, 'Regular welfare check completed. Citizen is doing well.', NOW(), NOW()),
('visit-2', 'citizen-2', 'officer-2', 'ps-2', 'beat-2', 'Routine', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', 'Completed', 25, 'Health check done. All vitals normal.', NOW(), NOW()),
('visit-3', 'citizen-3', 'officer-1', 'ps-1', 'beat-1', 'Routine', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', 'Completed', 35, 'Discussed safety measures. Citizen in good health.', NOW(), NOW()),
('visit-4', 'citizen-4', 'officer-3', 'ps-3', 'beat-3', 'Routine', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', 'Completed', 28, 'Regular check. No issues reported.', NOW(), NOW()),
('visit-5', 'citizen-7', 'officer-3', 'ps-3', 'beat-3', 'Routine', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', 'Completed', 32, 'Welfare visit completed successfully.', NOW(), NOW()),
-- Upcoming visits (scheduled 3 days from now)
('visit-11', 'citizen-1', 'officer-2', 'ps-2', 'beat-2', 'Routine', NOW() + INTERVAL '3 days', NULL, 'Scheduled', NULL, 'Scheduled welfare visit', NOW(), NOW()),
('visit-12', 'citizen-2', 'officer-2', 'ps-2', 'beat-2', 'Routine', NOW() + INTERVAL '3 days', NULL, 'Scheduled', NULL, 'Scheduled welfare visit', NOW(), NOW()),
('visit-13', 'citizen-3', 'officer-1', 'ps-1', 'beat-1', 'Routine', NOW() + INTERVAL '4 days', NULL, 'Scheduled', NULL, 'Scheduled welfare visit', NOW(), NOW()),
('visit-14', 'citizen-4', 'officer-3', 'ps-3', 'beat-3', 'Routine', NOW() + INTERVAL '5 days', NULL, 'Scheduled', NULL, 'Scheduled welfare visit', NOW(), NOW()),
('visit-15', 'citizen-9', 'officer-2', 'ps-2', 'beat-2', 'Routine', NOW() + INTERVAL '6 days', NULL, 'Scheduled', NULL, 'Scheduled welfare visit', NOW(), NOW());

-- Insert Citizen Auth (password is bcrypt hash of 'Citizen@123')
INSERT INTO "CitizenAuth" (id, "mobileNumber", password, "citizenId", "isVerified", "createdAt", "updatedAt") VALUES
('auth-1', '9876543230', '$2a$10$YourHashedPasswordHere1', 'citizen-1', true, NOW(), NOW()),
('auth-2', '9876543231', '$2a$10$YourHashedPasswordHere2', 'citizen-2', true, NOW(), NOW()),
('auth-3', '9876543232', '$2a$10$YourHashedPasswordHere3', 'citizen-3', true, NOW(), NOW()),
('auth-4', '9876543233', '$2a$10$YourHashedPasswordHere4', 'citizen-4', true, NOW(), NOW()),
('auth-5', '9876543234', '$2a$10$YourHashedPasswordHere5', 'citizen-5', true, NOW(), NOW()),
('auth-6', '9876543235', '$2a$10$YourHashedPasswordHere6', 'citizen-6', true, NOW(), NOW()),
('auth-7', '9876543236', '$2a$10$YourHashedPasswordHere7', 'citizen-7', true, NOW(), NOW()),
('auth-8', '9876543237', '$2a$10$YourHashedPasswordHere8', 'citizen-8', true, NOW(), NOW()),
('auth-9', '9876543238', '$2a$10$YourHashedPasswordHere9', 'citizen-9', true, NOW(), NOW()),
('auth-10', '9876543239', '$2a$10$YourHashedPasswordHere10', 'citizen-10', true, NOW(), NOW());

-- Summary
SELECT 'Database seeded successfully!' as message;
SELECT COUNT(*) as districts FROM "District";
SELECT COUNT(*) as police_stations FROM "PoliceStation";
SELECT COUNT(*) as beats FROM "Beat";
SELECT COUNT(*) as officers FROM "BeatOfficer";
SELECT COUNT(*) as citizens FROM "SeniorCitizen";
SELECT COUNT(*) as emergency_contacts FROM "EmergencyContact";
SELECT COUNT(*) as visits FROM "Visit";
SELECT COUNT(*) as citizen_auth FROM "CitizenAuth";
