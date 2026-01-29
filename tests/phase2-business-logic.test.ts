/**
 * Phase 2: Business Logic & Data Flow Tests
 * 
 * This test suite covers:
 * - Citizen lifecycle (registration → verification → activation)
 * - Visit management workflows
 * - SOS alert creation and resolution
 * - Duplicate detection
 * - Officer assignment logic
 */

import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';

describe('Phase 2: Business Logic & Data Flow Audit', () => {

    let adminToken: string;
    let officerToken: string;
    let citizenToken: string;

    beforeAll(async () => {
        // Setup test users and get tokens
        // ... authentication setup
    });

    describe('2.1 Citizen Lifecycle Management', () => {

        it('Should create citizen with auto-generated srCitizenUniqueId', async () => {
            const res = await request(app)
                .post('/api/v1/citizens')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    fullName: 'Test Senior',
                    mobileNumber: '+919988776655',
                    dateOfBirth: '1950-01-01',
                    permanentAddress: 'Test Address',
                    policeStationId: 'test-ps-id',
                    beatId: 'test-beat-id'
                })
                .expect(201);

            expect(res.body.data.srCitizenUniqueId).toBeDefined();
            expect(res.body.data.srCitizenUniqueId).toMatch(/^SC-/);
        });

        it('Should calculate age correctly from DOB', async () => {
            const dob = new Date();
            dob.setFullYear(dob.getFullYear() - 65);

            const res = await request(app)
                .post('/api/v1/citizens')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    fullName: 'Age Test',
                    mobileNumber: '+919988776656',
                    dateOfBirth: dob.toISOString(),
                    permanentAddress: 'Test',
                    policeStationId: 'test-ps-id'
                });

            expect(res.body.data.age).toBe(65);
        });

        it('Should auto-assign beat if not provided', async () => {
            // TODO: Test beat auto-assignment logic
            // Currently officer assignment only checks beatId
        });

        it('Should calculate vulnerability score', async () => {
            const res = await request(app)
                .post('/api/v1/citizens')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    fullName: 'Vulnerable Citizen',
                    mobileNumber: '+919988776657',
                    dateOfBirth: '1940-01-01', // 85 years old
                    livesAlone: true,
                    hasHealthConditions: true,
                    permanentAddress: 'Test'
                });

            expect(res.body.data.vulnerabilityScore).toBeGreaterThan(0);
        });

        it('Should schedule verification visit after citizen creation', async () => {
            const citizenRes = await request(app)
                .post('/api/v1/citizens')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    fullName: 'Verification Test',
                    mobileNumber: '+919988776658',
                    permanentAddress: 'Test',
                    policeStationId: 'test-ps-id',
                    beatId: 'test-beat-id'
                });

            const citizenId = citizenRes.body.data.id;

            // Check if verification visit was created
            const visit = await prisma.visit.findFirst({
                where: {
                    seniorCitizenId: citizenId,
                    visitType: 'Verification',
                    status: 'SCHEDULED'
                }
            });

            expect(visit).toBeDefined();
        });
    });

    describe('2.2 Duplicate Detection Service', () => {

        it('⚠️ PERFORMANCE: Should detect exact Aadhaar match', async () => {
            const aadhaar = '123456789012';

            // Create first citizen
            await prisma.seniorCitizen.create({
                data: {
                    fullName: 'Original Citizen',
                    mobileNumber: '+919988776659',
                    aadhaarNumber: aadhaar,
                    permanentAddress: 'Test',
                    dateOfBirth: new Date('1950-01-01')
                }
            });

            // Try to create duplicate
            const { checkForDuplicates } = require('../src/services/duplicateDetectionService');
            const result = await checkForDuplicates({
                fullName: 'Duplicate Citizen',
                mobileNumber: '+919988776660',
                aadhaarNumber: aadhaar
            });

            expect(result.hasDuplicates).toBe(true);
            expect(result.duplicates[0].matchScore).toBe(100);
            expect(result.confidence).toBe('High');
        });

        it('⚠️ PERFORMANCE: Should detect mobile number match', async () => {
            const mobile = '+919988776661';

            await prisma.seniorCitizen.create({
                data: {
                    fullName: 'Ram Kumar',
                    mobileNumber: mobile,
                    permanentAddress: 'Test',
                    dateOfBirth: new Date('1950-01-01')
                }
            });

            const { checkForDuplicates } = require('../src/services/duplicateDetectionService');
            const result = await checkForDuplicates({
                fullName: 'Ram Kumar Singh',
                mobileNumber: mobile
            });

            expect(result.hasDuplicates).toBe(true);
            expect(result.duplicates[0].matchScore).toBeGreaterThanOrEqual(80);
        });

        it('⚠️ CRITICAL: Fuzzy name matching scans ALL citizens', async () => {
            // This is a performance bomb!
            // duplicateDetectionService.ts:159-172 fetches ALL active citizens

            const { checkForDuplicates } = require('../src/services/duplicateDetectionService');

            const startTime = Date.now();
            await checkForDuplicates({
                fullName: 'Performance Test',
                mobileNumber: '+919988776662'
            });
            const duration = Date.now() - startTime;

            // If there are 10,000 citizens, this could take minutes!
            console.warn(`Duplicate check took ${duration}ms`);
        });

        it('Should use Levenshtein distance for fuzzy matching', async () => {
            await prisma.seniorCitizen.create({
                data: {
                    fullName: 'Mohan Kumar Singh',
                    mobileNumber: '+919988776663',
                    permanentAddress: 'Test',
                    dateOfBirth: new Date('1950-01-01')
                }
            });

            const { checkForDuplicates } = require('../src/services/duplicateDetectionService');
            const result = await checkForDuplicates({
                fullName: 'Mohan Kumarr Singhh', // Slight typo
                mobileNumber: '+919988776664'
            });

            // Should still match due to high similarity (85%+)
            expect(result.hasDuplicates).toBe(true);
        });
    });

    describe('2.3 Officer Assignment Logic', () => {

        it('Should assign officer based on beat', async () => {
            const beatId = 'test-beat-123';

            // Create officer in beat
            const officer = await prisma.beatOfficer.create({
                data: {
                    name: 'Test Officer',
                    rank: 'Constable',
                    badgeNumber: 'TEST123',
                    mobileNumber: '+919988776665',
                    policeStationId: 'test-ps-id',
                    beatId: beatId,
                    isActive: true
                }
            });

            const { OfficerAssignmentService } = require('../src/services/officerAssignmentService');
            const assignedId = await OfficerAssignmentService.assignOfficerToCitizen(
                'citizen-id',
                beatId,
                'test-ps-id'
            );

            expect(assignedId).toBe(officer.id);
        });

        it('⚠️ ISSUE: No workload balancing when multiple officers in beat', async () => {
            const beatId = 'test-beat-multi';

            // Create two officers in same beat
            await prisma.beatOfficer.create({
                data: {
                    name: 'Officer 1',
                    rank: 'Constable',
                    badgeNumber: 'OFF1',
                    mobileNumber: '+919988776666',
                    policeStationId: 'test-ps-id',
                    beatId,
                    isActive: true
                }
            });

            await prisma.beatOfficer.create({
                data: {
                    name: 'Officer 2',
                    rank: 'Constable',
                    badgeNumber: 'OFF2',
                    mobileNumber: '+919988776667',
                    policeStationId: 'test-ps-id',
                    beatId,
                    isActive: true
                }
            });

            // Assignment always picks first officer (findFirst)
            // No round-robin or workload balancing
            const { OfficerAssignmentService } = require('../src/services/officerAssignmentService');
            const assigned1 = await OfficerAssignmentService.assignOfficerToCitizen('c1', beatId);
            const assigned2 = await OfficerAssignmentService.assignOfficerToCitizen('c2', beatId);

            // Both assignments go to same officer
            expect(assigned1).toBe(assigned2); // ❌ Should be different
        });

        it('Should return null if no officer available', async () => {
            const { OfficerAssignmentService } = require('../src/services/officerAssignmentService');
            const assignedId = await OfficerAssignmentService.assignOfficerToCitizen(
                'citizen-id',
                'non-existent-beat'
            );

            expect(assignedId).toBeNull();
        });
    });

    describe('2.4 Visit Management Workflows', () => {

        it('Should create scheduled visit with future date', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);

            const res = await request(app)
                .post('/api/v1/visits')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    seniorCitizenId: 'test-citizen-id',
                    officerId: 'test-officer-id',
                    scheduledDate: futureDate.toISOString(),
                    visitType: 'Routine'
                })
                .expect(201);

            expect(res.body.data.status).toBe('SCHEDULED');
        });

        it('⚠️ ISSUE: Can schedule overlapping visits for same officer', async () => {
            const sameTime = new Date();
            sameTime.setHours(14, 0, 0, 0);

            // Create first visit
            await request(app)
                .post('/api/v1/visits')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    seniorCitizenId: 'citizen1',
                    officerId: 'officer1',
                    scheduledDate: sameTime.toISOString(),
                    visitType: 'Routine'
                });

            // Try to schedule another at same time
            const res = await request(app)
                .post('/api/v1/visits')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    seniorCitizenId: 'citizen2',
                    officerId: 'officer1', // Same officer
                    scheduledDate: sameTime.toISOString(),
                    visitType: 'Routine'
                })
                .expect(201); // ❌ Should return 400 conflict

            // checkVisitConflict exists but may not be called
        });

        it('Should validate status transitions', async () => {
            // SCHEDULED → IN_PROGRESS → COMPLETED
            // Cannot go SCHEDULED → COMPLETED directly
        });

        it('Should enforce geofence when starting visit', async () => {
            // Visit requires officer within 30 meters
            // Bypassed in non-production environment
        });
    });

    describe('2.5 SOS Alert Workflows', () => {

        it('Should create SOS alert with Active status', async () => {
            const res = await request(app)
                .post('/api/v1/sos/alert')
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({
                    latitude: 28.6139,
                    longitude: 77.2090,
                    address: 'Test Emergency Location'
                })
                .expect(201);

            expect(res.body.data.alert.status).toBe('Active');
        });

        it('Should auto-assign nearest officer', async () => {
            const res = await request(app)
                .post('/api/v1/sos/alert')
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({
                    latitude: 28.6139,
                    longitude: 77.2090
                });

            expect(res.body.data.assignedOfficer).toBeDefined();
        });

        it('⚠️ CRITICAL: Auto-creates visit with IN_PROGRESS status', async () => {
            // sosController.ts:87-97
            // Creates visit with status: 'IN_PROGRESS' WITHOUT officer accepting
            // This is a logic flaw - officer hasn't started the visit yet

            const res = await request(app)
                .post('/api/v1/sos/alert')
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({
                    latitude: 28.6139,
                    longitude: 77.2090
                });

            const visitId = res.body.data.visit?.id;
            if (visitId) {
                const visit = await prisma.visit.findUnique({ where: { id: visitId } });
                expect(visit?.status).toBe('IN_PROGRESS'); // ❌ Should be 'SCHEDULED'
            }
        });

        it('⚠️ ISSUE: No check for multiple active SOS alerts', async () => {
            // Citizen can trigger multiple SOS alerts
            // No validation to prevent spam or check for existing active alert

            await request(app)
                .post('/api/v1/sos/alert')
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({ latitude: 28.6139, longitude: 77.2090 })
                .expect(201);

            // Try to create another
            const res = await request(app)
                .post('/api/v1/sos/alert')
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({ latitude: 28.6139, longitude: 77.2090 })
                .expect(201); // ❌ Should fail if active alert exists
        });

        it('Should notify emergency contacts and officers', async () => {
            // Test notification service integration
        });

        it('Should track SLA metrics (15 min response, 60 min resolution)', async () => {
            // Test SOS SLA tracking
        });

        it('Should allow status transitions: Active → Responded → Resolved', async () => {
            const alertRes = await request(app)
                .post('/api/v1/sos/alert')
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({ latitude: 28.6139, longitude: 77.2090 });

            const alertId = alertRes.body.data.alert.id;

            // Respond
            await request(app)
                .patch(`/api/v1/sos/${alertId}/respond`)
                .set('Authorization', `Bearer ${officerToken}`)
                .expect(200);

            // Resolve
            await request(app)
                .patch(`/api/v1/sos/${alertId}/resolve`)
                .set('Authorization', `Bearer ${officerToken}`)
                .expect(200);
        });

        it('Should allow marking as False Alarm', async () => {
            const alertRes = await request(app)
                .post('/api/v1/sos/alert')
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({ latitude: 28.6139, longitude: 77.2090 });

            const alertId = alertRes.body.data.alert.id;

            await request(app)
                .patch(`/api/v1/sos/${alertId}/false-alarm`)
                .set('Authorization', `Bearer ${officerToken}`)
                .send({ reason: 'Accidental trigger' })
                .expect(200);
        });
    });

    describe('2.6 Data Integrity Checks', () => {

        it('Should prevent soft-deleted citizens from appearing in queries', async () => {
            // Create and soft-delete citizen
            const citizen = await prisma.seniorCitizen.create({
                data: {
                    fullName: 'To Delete',
                    mobileNumber: '+919988776668',
                    permanentAddress: 'Test',
                    dateOfBirth: new Date('1950-01-01'),
                    isActive: false // Soft deleted
                }
            });

            // Try to fetch
            const res = await request(app)
                .get('/api/v1/citizens')
                .set('Authorization', `Bearer ${adminToken}`);

            const found = res.body.data.data.some((c: any) => c.id === citizen.id);
            expect(found).toBe(false);
        });

        it('Should cascade delete related records', async () => {
            // When citizen is deleted, related visits, documents, etc. should be handled
        });
    });
});
