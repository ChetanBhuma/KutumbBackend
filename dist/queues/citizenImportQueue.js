"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.citizenImportQueue = void 0;
const bull_1 = __importDefault(require("bull"));
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
const eventBus_1 = require("../events/eventBus");
// Create queue
exports.citizenImportQueue = new bull_1.default('citizen-import', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
    }
});
// Process jobs
exports.citizenImportQueue.process(async (job) => {
    const { row, rowIndex, importedBy } = job.data;
    try {
        // Validate phone number
        const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
        const normalizedPhone = row.mobileNumber.replace(/\s+/g, '').replace(/^(\+91|91)/, '');
        if (!phoneRegex.test(normalizedPhone)) {
            throw new Error('Invalid mobile number format');
        }
        // Check duplicate
        const existingCitizen = await database_1.prisma.seniorCitizen.findFirst({
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
        const citizen = await database_1.prisma.seniorCitizen.create({
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
        eventBus_1.eventBus.emit(eventBus_1.AppEvent.CITIZEN_REGISTERED, {
            citizenId: citizen.id,
            fullName: citizen.fullName,
            mobileNumber: citizen.mobileNumber,
            beatId: citizen.beatId
        });
        logger_1.auditLogger.info('Citizen imported via queue', {
            citizenId: citizen.id,
            rowIndex,
            importedBy
        });
        return { success: true, citizenId: citizen.id };
    }
    catch (error) {
        logger_1.auditLogger.error('Citizen import job failed', {
            rowIndex,
            error: error.message,
            row
        });
        throw error;
    }
});
// Error handler
exports.citizenImportQueue.on('failed', (job, err) => {
    logger_1.auditLogger.error('Import job failed permanently', {
        jobId: job.id,
        error: err.message
    });
});
// Completed handler
exports.citizenImportQueue.on('completed', (job, result) => {
    logger_1.auditLogger.info('Import job completed', {
        jobId: job.id,
        result
    });
});
//# sourceMappingURL=citizenImportQueue.js.map