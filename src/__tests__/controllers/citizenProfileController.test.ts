
import request from 'supertest';
import express from 'express';
import { CitizenProfileController } from '../../controllers/citizenProfileController';
import { authenticateCitizen } from '../../middleware/citizenAuth';
import { errorHandler } from '../../middleware/errorHandler';
import { prisma } from '../../config/database';
import { mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

// Mock the database config
jest.mock('../../config/database', () => {
    const { mockDeep } = require('jest-mock-extended');
    return {
        __esModule: true,
        prisma: mockDeep()
    };
});

const mockPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
    mockReset(mockPrisma);
});

// Mock authentication middleware
jest.mock('../../middleware/citizenAuth', () => ({
    authenticateCitizen: (req: any, _res: any, next: any) => {
        req.user = {
            id: 'auth_123',
            citizenId: 'citizen_123',
            mobileNumber: '9999999999',
            role: 'CITIZEN'
        };
        next();
    }
}));

// Mock logger
jest.mock('../../config/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    },
    auditLogger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}));

// Mock NotificationService
jest.mock('../../services/notificationService', () => ({
    NotificationService: {
        sendSOSAlert: () => Promise.resolve(true)
    }
}));

// Mock CloudStorageService
jest.mock('../../services/cloudStorageService', () => ({
    cloudStorage: {
        uploadFile: jest.fn().mockResolvedValue('https://cloud-storage.com/file.pdf')
    }
}));

const app = express();
app.use(express.json());
app.use(authenticateCitizen);

// Mount routes for testing
app.get('/profile', CitizenProfileController.getProfile);
app.patch('/profile', CitizenProfileController.updateProfile);
app.get('/visits', CitizenProfileController.getVisits);
app.post('/visits/request', CitizenProfileController.requestVisit);
app.post('/sos', CitizenProfileController.createSOS);
app.post('/feedback', CitizenProfileController.submitFeedback);
app.get('/documents', CitizenProfileController.getDocuments);
app.post('/documents', (req: any, _res: any, next: any) => {
    // Mock multer middleware
    req.file = {
        filename: 'test.pdf',
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024
    } as any;
    next();
}, CitizenProfileController.uploadDocument);
app.patch('/notifications', CitizenProfileController.updateNotifications);

// Add error handler
app.use(errorHandler);

describe('Citizen Profile Controller', () => {

    describe('GET /profile', () => {
        it('should return citizen profile', async () => {
            const mockCitizen = {
                id: 'citizen_123',
                fullName: 'John Doe',
                mobileNumber: '9999999999',
                policeStation: { id: 'ps_1', name: 'Central Station' }
            };

            (mockPrisma.seniorCitizen.findUnique as jest.Mock).mockResolvedValue(mockCitizen);

            const response = await request(app).get('/profile');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.citizen).toHaveProperty('id', 'citizen_123');
        });

        it('should return 404 if profile not found', async () => {
            (mockPrisma.seniorCitizen.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await request(app).get('/profile');

            expect(response.status).toBe(404);
        });
    });

    describe('PATCH /profile', () => {
        it('should update allowed fields', async () => {
            const updateData = {
                fullName: 'John Updated',
                bloodGroup: 'O+'
            };

            (mockPrisma.seniorCitizen.update as jest.Mock).mockResolvedValue({
                id: 'citizen_123',
                ...updateData
            });

            const response = await request(app)
                .patch('/profile')
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.data.citizen.fullName).toBe('John Updated');
        });
    });

    describe('GET /visits', () => {
        it('should return own visits', async () => {
            const mockVisits = [
                { id: 'visit_1', scheduledDate: new Date() }
            ];

            (mockPrisma.visit.findMany as jest.Mock).mockResolvedValue(mockVisits);

            const response = await request(app).get('/visits');

            expect(response.status).toBe(200);
            expect(response.body.data.visits).toHaveLength(1);
            // Verify query filter used citizenId
            expect(mockPrisma.visit.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { seniorCitizenId: 'citizen_123' }
                })
            );
        });
    });

    describe('POST /visits/request', () => {
        it('should create visit request', async () => {
            const visitData = {
                preferredDate: '2025-12-01',
                visitType: 'Regular',
                notes: 'Checkup'
            };

            // Cast to any to bypass type checking for now since we know the model exists in schema but maybe not in generated client types yet
            (mockPrisma as any).visitRequest.create.mockResolvedValue({
                id: 'vr_1',
                ...visitData,
                status: 'Pending'
            });

            const response = await request(app)
                .post('/visits/request')
                .send(visitData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });
    });

    describe('POST /sos', () => {
        it('should create SOS alert', async () => {
            const sosData = {
                latitude: 28.6139,
                longitude: 77.2090,
                address: 'Connaught Place'
            };

            (mockPrisma.sOSAlert.create as jest.Mock).mockResolvedValue({
                id: 'sos_1',
                ...sosData,
                status: 'Active'
            });

            // Mock citizen finding for notifications
            (mockPrisma.seniorCitizen.findUnique as jest.Mock).mockResolvedValue({
                id: 'citizen_123',
                fullName: 'John Doe',
                mobileNumber: '9999999999',
                policeStation: {
                    officers: [{ name: 'Officer 1', mobileNumber: '8888888888' }]
                },
                emergencyContacts: [{ name: 'Contact 1', mobileNumber: '7777777777' }]
            });

            const response = await request(app)
                .post('/sos')
                .send(sosData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });

        it('should fail without location', async () => {
            const response = await request(app)
                .post('/sos')
                .send({ address: 'No Loc' });

            expect(response.status).toBe(400); // AppError 400
        });
    });

    describe('POST /feedback', () => {
        it('should submit feedback for own completed visit', async () => {
            // Mock visit check
            (mockPrisma.visit.findUnique as jest.Mock).mockResolvedValue({
                id: 'visit_1',
                seniorCitizenId: 'citizen_123',
                status: 'Completed'
            });

            (mockPrisma as any).visitFeedback.create.mockResolvedValue({
                id: 'fb_1',
                rating: 5
            });

            const response = await request(app)
                .post('/feedback')
                .send({
                    visitId: 'visit_1',
                    rating: 5,
                    comments: 'Great service'
                });

            expect(response.status).toBe(201);
        });

        it('should prevent feedback for other citizen visit', async () => {
            (mockPrisma.visit.findUnique as jest.Mock).mockResolvedValue({
                id: 'visit_other',
                seniorCitizenId: 'citizen_other', // Different ID
                status: 'Completed'
            });

            const response = await request(app)
                .post('/feedback')
                .send({
                    visitId: 'visit_other',
                    rating: 5
                });

            expect(response.status).toBe(403);
        });
    });

    describe('POST /documents', () => {
        it('should upload document', async () => {
            (mockPrisma as any).document.create.mockResolvedValue({
                id: 'doc_1',
                documentName: 'test.pdf',
                fileUrl: '/uploads/documents/test.pdf'
            });

            const response = await request(app)
                .post('/documents')
                .send({ documentType: 'Medical' });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });
    });

    describe('PATCH /notifications', () => {
        it('should update notification preferences', async () => {
            const prefs = {
                allowNotifications: true,
                allowFamilyNotification: false
            };

            (mockPrisma.seniorCitizen.update as jest.Mock).mockResolvedValue({
                id: 'citizen_123',
                ...prefs
            });

            const response = await request(app)
                .patch('/notifications')
                .send(prefs);

            expect(response.status).toBe(200);
            expect(response.body.data.citizen.allowFamilyNotification).toBe(false);
        });
    });

});


