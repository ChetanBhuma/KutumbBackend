import Queue from 'bull';
import { prisma } from '../config/database';
import { auditLogger } from '../config/logger';
import { eventBus, AppEvent } from '../events/eventBus';

/**
 * Job queue for processing large CSV imports
 * Uses Bull with Redis for distributed processing
 */

interface CitizenImportJob {
    row: any;
    rowIndex: number;
    importedBy: string;
}

// Create queue
export const citizenImportQueue = new Queue<CitizenImportJob>('citizen-import', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
    }
});

// Process jobs
citizenImportQueue.process(async (job: any) => {
    const { row, rowIndex, importedBy } = job.data;

    try {
        // Validate phone number
        const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
        const normalizedPhone = row.mobileNumber.replace(/\s+/g, '').replace(/^(\+91|91)/, '');

        if (!phoneRegex.test(normalizedPhone)) {
            throw new Error('Invalid mobile number format');
        }

        // Check duplicate
        const existingCitizen = await prisma.seniorCitizen.findFirst({
            where: { mobileNumber: normalizedPhone }
        });

        if (existingCitizen) {
            throw new Error(`Duplicate mobile number (already exists for ${existingCitizen.fullName})`);
        }

        // Calculate age
        const dob = new Date(row.dateOfBirth);
        const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

        if (age < 60) {
            throw new Error('Age must be >= 60');
        }

        // Create citizen
        const citizen = await prisma.seniorCitizen.create({
            data: {
                fullName: row.fullName,
                dateOfBirth: dob,
                age,
                mobileNumber: normalizedPhone,
                aadhaarNumber: row.aadhaarNumber || null,
                permanentAddress: row.address || 'N/A',
                pinCode: row.pinCode || '000000',
                gender: row.gender || 'Other',
                receivedBy: importedBy,
                dataEntryCompletedBy: importedBy,
                dataEntryDate: new Date()
            }
        });

        // Emit event
        eventBus.emit(AppEvent.CITIZEN_REGISTERED, {
            citizenId: citizen.id,
            fullName: citizen.fullName,
            mobileNumber: citizen.mobileNumber,
            beatId: citizen.beatId
        });

        auditLogger.info('Citizen imported via queue', {
            citizenId: citizen.id,
            rowIndex,
            importedBy
        });

        return { success: true, citizenId: citizen.id };
    } catch (error: any) {
        auditLogger.error('Citizen import job failed', {
            rowIndex,
            error: error.message,
            row
        });
        throw error;
    }
});

// Error handler
citizenImportQueue.on('failed', (job: any, err: Error) => {
    auditLogger.error('Import job failed permanently', {
        jobId: job.id,
        error: err.message
    });
});

// Completed handler
citizenImportQueue.on('completed', (job: any, result: any) => {
    auditLogger.info('Import job completed', {
        jobId: job.id,
        result
    });
});
