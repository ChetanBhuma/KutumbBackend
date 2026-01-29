import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/authenticate';
import { AppError } from '../middleware/errorHandler';
import { auditLogger } from '../config/logger';
import csv from 'csv-parser';
import { Readable } from 'stream';

export class BulkOperationsController {
    /**
     * Bulk import citizens from CSV
     * Expected CSV format: fullName,dateOfBirth,mobileNumber,aadhaarNumber,address,pinCode
     */
    static async importCitizens(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.file) {
                throw new AppError('CSV file is required', 400);
            }

            const results: any[] = [];
            const errors: any[] = [];
            let successCount = 0;

            // Parse CSV
            const stream = Readable.from(req.file.buffer.toString());

            await new Promise((resolve, reject) => {
                stream
                    .pipe(csv())
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
                    const existingCitizen = await prisma.seniorCitizen.findFirst({
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
                            receivedBy: req.user?.email,
                            dataEntryCompletedBy: req.user?.email,
                            dataEntryDate: new Date()
                        }
                    });

                    // Emit event for bulk imported citizen
                    const { eventBus, AppEvent } = await import('../events/eventBus');
                    eventBus.emit(AppEvent.CITIZEN_REGISTERED, {
                        citizenId: citizen.id,
                        fullName: citizen.fullName,
                        mobileNumber: citizen.mobileNumber,
                        beatId: citizen.beatId
                    });

                    successCount++;
                } catch (error: any) {
                    errors.push({ row: index + 1, error: error.message, data: row });
                }
            }

            auditLogger.info('Bulk citizen import completed', {
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
        } catch (error) {
            next(error);
        }
    }

    /**
     * Bulk assign officers to citizens in a beat
     */
    static async bulkAssignOfficer(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { beatId, officerId, citizenIds } = req.body;

            if (!beatId || !officerId || !Array.isArray(citizenIds) || citizenIds.length === 0) {
                throw new AppError('beatId, officerId, and citizenIds array are required', 400);
            }

            // Verify officer exists and is active
            const officer = await prisma.beatOfficer.findFirst({
                where: { id: officerId, isActive: true, beatId }
            });

            if (!officer) {
                throw new AppError('Officer not found or not assigned to this beat', 404);
            }

            // Update citizens
            const result = await prisma.seniorCitizen.updateMany({
                where: {
                    id: { in: citizenIds },
                    isActive: true
                },
                data: {
                    beatId: beatId
                }
            });

            auditLogger.info('Bulk officer assignment completed', {
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
        } catch (error) {
            next(error);
        }
    }

    /**
     * Download CSV template for citizen import
     */
    static async downloadTemplate(_req: Request, res: Response) {
        const template = 'fullName,dateOfBirth,mobileNumber,gender,aadhaarNumber,address,pinCode\n' +
            'John Doe,1950-01-15,9876543210,Male,123456789012,123 Main St,110001\n';

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=citizen_import_template.csv');
        res.send(template);
    }
}
