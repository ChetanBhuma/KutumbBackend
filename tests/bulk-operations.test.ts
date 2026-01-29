import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import path from 'path';
import fs from 'fs';

describe('Bulk Operations API', () => {
    let authToken: string;
    let adminUserId: string;

    beforeAll(async () => {
        // Create test admin user
        const admin = await prisma.user.create({
            data: {
                email: 'bulk-admin@test.com',
                phone: '+919999999991',
                passwordHash: '$2a$10$test',
                role: 'ADMIN',
                isActive: true,
                isEmailVerified: true
            }
        });
        adminUserId = admin.id;

        // Mock login to get token (simplified)
        authToken = 'mock-jwt-token';
    });

    afterAll(async () => {
        // Cleanup
        await prisma.seniorCitizen.deleteMany({
            where: { mobileNumber: { startsWith: '999' } }
        });
        await prisma.user.delete({ where: { id: adminUserId } });
        await prisma.$disconnect();
    });

    describe('POST /bulk/import-citizens', () => {
        it('should import valid citizens from CSV', async () => {
            const csvContent =
                'fullName,dateOfBirth,mobileNumber,gender,aadhaarNumber,address,pinCode\n' +
                'Test Citizen 1,1950-01-15,9998887771,Male,123456789012,Test Address 1,110001\n' +
                'Test Citizen 2,1955-06-20,9998887772,Female,123456789013,Test Address 2,110002\n';

            const csvPath = path.join(__dirname, 'test-import.csv');
            fs.writeFileSync(csvPath, csvContent);

            const response = await request(app)
                .post('/api/v1/bulk/import-citizens')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', csvPath);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.success).toBe(2);
            expect(response.body.data.failures).toBe(0);

            // Cleanup
            fs.unlinkSync(csvPath);
        });

        it('should reject invalid phone numbers', async () => {
            const csvContent =
                'fullName,dateOfBirth,mobileNumber,gender,aadhaarNumber,address,pinCode\n' +
                'Invalid Phone,1950-01-15,1234567890,Male,123456789012,Test Address,110001\n';

            const csvPath = path.join(__dirname, 'test-invalid.csv');
            fs.writeFileSync(csvPath, csvContent);

            const response = await request(app)
                .post('/api/v1/bulk/import-citizens')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', csvPath);

            expect(response.status).toBe(200);
            expect(response.body.data.success).toBe(0);
            expect(response.body.data.failures).toBe(1);
            expect(response.body.data.errors[0].error).toContain('Invalid mobile number');

            fs.unlinkSync(csvPath);
        });

        it('should detect duplicate phone numbers', async () => {
            // Create existing citizen
            await prisma.seniorCitizen.create({
                data: {
                    fullName: 'Existing Citizen',
                    dateOfBirth: new Date('1950-01-01'),
                    age: 74,
                    mobileNumber: '9998887773',
                    permanentAddress: 'Test',
                    pinCode: '110001',
                    gender: 'Male'
                }
            });

            const csvContent =
                'fullName,dateOfBirth,mobileNumber,gender,aadhaarNumber,address,pinCode\n' +
                'Duplicate Citizen,1955-01-15,9998887773,Male,123456789012,Test Address,110001\n';

            const csvPath = path.join(__dirname, 'test-duplicate.csv');
            fs.writeFileSync(csvPath, csvContent);

            const response = await request(app)
                .post('/api/v1/bulk/import-citizens')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', csvPath);

            expect(response.body.data.failures).toBe(1);
            expect(response.body.data.errors[0].error).toContain('Duplicate mobile number');

            fs.unlinkSync(csvPath);
        });

        it('should reject citizens under 60 years old', async () => {
            const csvContent =
                'fullName,dateOfBirth,mobileNumber,gender,aadhaarNumber,address,pinCode\n' +
                'Young Person,2000-01-15,9998887774,Male,123456789012,Test Address,110001\n';

            const csvPath = path.join(__dirname, 'test-young.csv');
            fs.writeFileSync(csvPath, csvContent);

            const response = await request(app)
                .post('/api/v1/bulk/import-citizens')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', csvPath);

            expect(response.body.data.failures).toBe(1);
            expect(response.body.data.errors[0].error).toContain('Age must be >= 60');

            fs.unlinkSync(csvPath);
        });
    });

    describe('POST /bulk/assign-officers', () => {
        it('should bulk assign citizens to officer', async () => {
            // Setup test data
            const beat = await prisma.beat.create({
                data: {
                    beatName: 'Test Beat',
                    pinCode: '110001'
                }
            });

            const officer = await prisma.beatOfficer.create({
                data: {
                    name: 'Test Officer',
                    mobileNumber: '9998887775',
                    beatId: beat.id,
                    isActive: true
                }
            });

            const citizen1 = await prisma.seniorCitizen.create({
                data: {
                    fullName: 'Citizen 1',
                    dateOfBirth: new Date('1950-01-01'),
                    age: 74,
                    mobileNumber: '9998887776',
                    permanentAddress: 'Test',
                    pinCode: '110001',
                    gender: 'Male'
                }
            });

            const citizen2 = await prisma.seniorCitizen.create({
                data: {
                    fullName: 'Citizen 2',
                    dateOfBirth: new Date('1955-01-01'),
                    age: 69,
                    mobileNumber: '9998887777',
                    permanentAddress: 'Test',
                    pinCode: '110001',
                    gender: 'Female'
                }
            });

            const response = await request(app)
                .post('/api/v1/bulk/assign-officers')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    beatId: beat.id,
                    officerId: officer.id,
                    citizenIds: [citizen1.id, citizen2.id]
                });

            expect(response.status).toBe(200);
            expect(response.body.data.updatedCount).toBe(2);

            // Cleanup
            await prisma.seniorCitizen.deleteMany({ where: { id: { in: [citizen1.id, citizen2.id] } } });
            await prisma.beatOfficer.delete({ where: { id: officer.id } });
            await prisma.beat.delete({ where: { id: beat.id } });
        });
    });

    describe('GET /bulk/import-template', () => {
        it('should download CSV template', async () => {
            const response = await request(app)
                .get('/api/v1/bulk/import-template');

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('text/csv');
            expect(response.text).toContain('fullName,dateOfBirth,mobileNumber');
        });
    });
});
