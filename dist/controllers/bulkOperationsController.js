"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkOperationsController = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../config/logger");
const csv_parser_1 = __importDefault(require("csv-parser"));
const stream_1 = require("stream");
class BulkOperationsController {
    /**
     * Bulk import citizens from CSV
     * Expected CSV format: fullName,dateOfBirth,mobileNumber,aadhaarNumber,address,pinCode
     */
    static async importCitizens(req, res, next) {
        try {
            if (!req.file) {
                throw new errorHandler_1.AppError('CSV file is required', 400);
            }
            const results = [];
            const errors = [];
            let successCount = 0;
            // Parse CSV
            const stream = stream_1.Readable.from(req.file.buffer.toString());
            await new Promise((resolve, reject) => {
                stream
                    .pipe((0, csv_parser_1.default)())
                    .on('data', (row) => results.push(row))
                    .on('end', resolve)
                    .on('error', reject);
            });
            // Process each row
            for (const [index, row] of results.entries()) {
                try {
                    // Validate required fields
                    if (!row.fullName || !row.dateOfBirth || !row.mobileNumber) {
                        errors.push({ row: index + 1, error: 'Missing required fields', data: row });
                        continue;
                    }
                    // Validate phone number format (Indian mobile)
                    const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
                    const normalizedPhone = row.mobileNumber.replace(/\s+/g, '').replace(/^(\+91|91)/, '');
                    if (!phoneRegex.test(normalizedPhone)) {
                        errors.push({ row: index + 1, error: 'Invalid mobile number format', data: row });
                        continue;
                    }
                    // Check for duplicate phone number in database
                    const existingCitizen = await database_1.prisma.seniorCitizen.findFirst({
                        where: { mobileNumber: normalizedPhone }
                    });
                    if (existingCitizen) {
                        errors.push({
                            row: index + 1,
                            error: `Duplicate mobile number (already exists for ${existingCitizen.fullName})`,
                            data: row
                        });
                        continue;
                    }
                    // Calculate age
                    const dob = new Date(row.dateOfBirth);
                    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                    if (age < 60) {
                        errors.push({ row: index + 1, error: 'Age must be >= 60', data: row });
                        continue;
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
                            receivedBy: req.user?.email,
                            dataEntryCompletedBy: req.user?.email,
                            dataEntryDate: new Date()
                        }
                    });
                    // Emit event for bulk imported citizen
                    const { eventBus, AppEvent } = await Promise.resolve().then(() => __importStar(require('../events/eventBus')));
                    eventBus.emit(AppEvent.CITIZEN_REGISTERED, {
                        citizenId: citizen.id,
                        fullName: citizen.fullName,
                        mobileNumber: citizen.mobileNumber,
                        beatId: citizen.beatId
                    });
                    successCount++;
                }
                catch (error) {
                    errors.push({ row: index + 1, error: error.message, data: row });
                }
            }
            logger_1.auditLogger.info('Bulk citizen import completed', {
                total: results.length,
                success: successCount,
                failures: errors.length,
                importedBy: req.user?.email
            });
            res.json({
                success: true,
                message: `Imported ${successCount} out of ${results.length} citizens`,
                data: {
                    total: results.length,
                    success: successCount,
                    failures: errors.length,
                    errors: errors.slice(0, 10) // Return first 10 errors
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Bulk assign officers to citizens in a beat
     */
    static async bulkAssignOfficer(req, res, next) {
        try {
            const { beatId, officerId, citizenIds } = req.body;
            if (!beatId || !officerId || !Array.isArray(citizenIds) || citizenIds.length === 0) {
                throw new errorHandler_1.AppError('beatId, officerId, and citizenIds array are required', 400);
            }
            // Verify officer exists and is active
            const officer = await database_1.prisma.beatOfficer.findFirst({
                where: { id: officerId, isActive: true, beatId }
            });
            if (!officer) {
                throw new errorHandler_1.AppError('Officer not found or not assigned to this beat', 404);
            }
            // Update citizens
            const result = await database_1.prisma.seniorCitizen.updateMany({
                where: {
                    id: { in: citizenIds },
                    isActive: true
                },
                data: {
                    beatId: beatId
                }
            });
            logger_1.auditLogger.info('Bulk officer assignment completed', {
                beatId,
                officerId,
                updatedCount: result.count,
                assignedBy: req.user?.email
            });
            res.json({
                success: true,
                message: `Assigned ${result.count} citizens to officer`,
                data: {
                    updatedCount: result.count
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Download CSV template for citizen import
     */
    static async downloadTemplate(_req, res) {
        const template = 'fullName,dateOfBirth,mobileNumber,gender,aadhaarNumber,address,pinCode\n' +
            'John Doe,1950-01-15,9876543210,Male,123456789012,123 Main St,110001\n';
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=citizen_import_template.csv');
        res.send(template);
    }
}
exports.BulkOperationsController = BulkOperationsController;
//# sourceMappingURL=bulkOperationsController.js.map