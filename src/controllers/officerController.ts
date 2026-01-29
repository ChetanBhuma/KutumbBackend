import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { auditLogger } from '../config/logger';
import { AuthRequest } from '../middleware/authenticate';
import { paginatedQuery } from '../utils/pagination';
import { buildWhereClause, buildOrderBy } from '../utils/queryBuilder';

export class OfficerController {
    /**
     * Get all officers with pagination and filters
     */
    /**
     * Get all officers with pagination and filters
     */
    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            const where = buildWhereClause(req.query, {
                searchFields: ['name', 'badgeNumber', 'mobileNumber'],
                exactMatchFields: ['policeStationId', 'beatId'],
                booleanFields: ['isActive']
            });

            // Handle 'hasBeat' filter
            if (req.query.hasBeat === 'true') {
                 where.beatId = { not: null };
            }


            // Apply Data Scope
            const scope = req.dataScope;
            if (scope && scope.level !== 'ALL') {
                if (scope.level === 'RANGE' && scope.jurisdictionIds.rangeId) {
                    where.rangeId = scope.jurisdictionIds.rangeId;
                } else if (scope.level === 'DISTRICT' && scope.jurisdictionIds.districtId) {
                    where.districtId = scope.jurisdictionIds.districtId;
                } else if (scope.level === 'SUBDIVISION' && scope.jurisdictionIds.subDivisionId) {
                    where.subDivisionId = scope.jurisdictionIds.subDivisionId;
                } else if (scope.level === 'POLICE_STATION' && scope.jurisdictionIds.policeStationId) {
                    where.policeStationId = scope.jurisdictionIds.policeStationId;
                } else if (scope.level === 'BEAT' && scope.jurisdictionIds.beatId) {
                    where.beatId = scope.jurisdictionIds.beatId;
                }
            }

            const result = await paginatedQuery(prisma.beatOfficer, {
                page: Number(req.query.page),
                limit: Number(req.query.limit),
                where,
                include: {
                    PoliceStation: {
                        select: { id: true, name: true, code: true }
                    },
                    District: {
                        select: { id: true, name: true }
                    },
                    Beat: {
                        select: { id: true, name: true, code: true }
                    },
                    _count: {
                        select: { Visit: true }
                    }
                },
                orderBy: buildOrderBy(req.query, { createdAt: 'desc' })
            });

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get officer by ID with assigned citizens
     */
    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const officer = await prisma.beatOfficer.findUnique({
                where: { id },
                include: {
                    PoliceStation: true,
                    District: true,
                    Beat: {
                        include: {
                            SeniorCitizen: {
                                where: { isActive: true },
                                select: {
                                    id: true,
                                    fullName: true,
                                    mobileNumber: true,
                                    vulnerabilityLevel: true,
                                    lastVisitDate: true
                                }
                            }
                        }
                    },
                    Visit: {
                        include: {
                            SeniorCitizen: {
                                select: { id: true, fullName: true, mobileNumber: true }
                            }
                        },
                        orderBy: { scheduledDate: 'desc' },
                        take: 20
                    }
                }
            });

            if (!officer) {
                throw new AppError('Officer not found', 404);
            }

            // Calculate workload statistics
            const assignedCitizens = officer.Beat?.SeniorCitizen.length || 0;
            const completedVisits = await prisma.visit.count({
                where: {
                    officerId: id,
                    status: 'COMPLETED'
                }
            });

            const pendingVisits = await prisma.visit.count({
                where: {
                    officerId: id,
                    status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
                }
            });

            res.json({
                success: true,
                data: {
                    officer,
                    workload: {
                        assignedCitizens,
                        completedVisits,
                        pendingVisits
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create new officer
     */
    static async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const officerData = req.body;

            // Check if badge number or mobile already exists
            const existing = await prisma.beatOfficer.findFirst({
                where: {
                    OR: [
                        { badgeNumber: officerData.badgeNumber },
                        { mobileNumber: officerData.mobileNumber }
                    ]
                }
            });

            if (existing) {
                throw new AppError('Officer with this badge number or mobile already exists', 409);
            }

            const officer = await prisma.beatOfficer.create({
                data: officerData,
                include: {
                    PoliceStation: true,
                    Beat: true
                }
            });

            auditLogger.info('Officer created', {
                officerId: officer.id,
                officerName: officer.name,
                badgeNumber: officer.badgeNumber,
                createdBy: req.user?.email,
                timestamp: new Date().toISOString()
            });

            res.status(201).json({
                success: true,
                data: { officer },
                message: 'Officer created successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update officer
     */
    /**
     * Update officer and sync with User account
     */
    static async update(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const existing = await prisma.beatOfficer.findUnique({
                where: { id },
                include: { user: true }
            });

            if (!existing) {
                throw new AppError('Officer not found', 404);
            }

            // Prepare User update data if critical fields change
            const userUpdateData: any = {};
            // Only update email/phone in User table if they are provided in request
            if (updateData.email !== undefined) userUpdateData.email = updateData.email;
            if (updateData.mobileNumber !== undefined) userUpdateData.phone = updateData.mobileNumber;

            // Transaction: Update BeatOfficer AND User (if needed)
            const officer = await prisma.$transaction(async (tx) => {
                const updatedOfficer = await tx.beatOfficer.update({
                    where: { id },
                    data: updateData,
                    include: {
                        PoliceStation: true,
                        Beat: true
                    }
                });

                if (existing.user && Object.keys(userUpdateData).length > 0) {
                    await tx.user.update({
                        where: { id: existing.user.id },
                        data: userUpdateData
                    });
                }

                return updatedOfficer;
            });

            auditLogger.info('Officer updated', {
                officerId: officer.id,
                officerName: officer.name,
                updatedBy: req.user?.email,
                changes: Object.keys(updateData),
                timestamp: new Date().toISOString()
            });

            res.json({
                success: true,
                data: { officer },
                message: 'Officer updated successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete (soft delete) officer
     */
    static async delete(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const officer = await prisma.beatOfficer.update({
                where: { id },
                data: { isActive: false }
            });

            auditLogger.warn('Officer deleted', {
                officerId: officer.id,
                officerName: officer.name,
                deletedBy: req.user?.email,
                timestamp: new Date().toISOString()
            });

            res.json({
                success: true,
                message: 'Officer deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Assign officer to beat
     */
    static async assignToBeat(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { beatId } = req.body;

            // Verify beat exists only if beatId is provided
            let beat = null;
            if (beatId) {
                beat = await prisma.beat.findUnique({ where: { id: beatId } });
                if (!beat) {
                    throw new AppError('Beat not found', 404);
                }
            }

            const officer = await prisma.beatOfficer.update({
                where: { id },
                data: { beatId: beatId || null }, // Set to null if beatId is falsy
                include: {
                    Beat: true,
                    PoliceStation: true
                }
            });

            auditLogger.info(beatId ? 'Officer assigned to beat' : 'Officer unassigned from beat', {
                officerId: officer.id,
                officerName: officer.name,
                beatId: beatId || 'Unassigned',
                beatName: beat?.name || 'Unassigned',
                assignedBy: req.user?.email,
                timestamp: new Date().toISOString()
            });

            res.json({
                success: true,
                data: { officer },
                message: beatId ? 'Officer assigned to beat successfully' : 'Officer unassigned successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get officer workload distribution
     */
    static async getWorkloadDistribution(req: Request, res: Response, next: NextFunction) {
        try {
            const where = buildWhereClause(req.query, {
                exactMatchFields: ['policeStationId'],
                booleanFields: ['isActive']
            });
            if (where.isActive === undefined) where.isActive = true;

            // Apply Data Scope
            const scope = req.dataScope;
            if (scope && scope.level !== 'ALL') {
                if (scope.level === 'RANGE' && scope.jurisdictionIds.rangeId) {
                    where.rangeId = scope.jurisdictionIds.rangeId;
                } else if (scope.level === 'DISTRICT' && scope.jurisdictionIds.districtId) {
                    where.districtId = scope.jurisdictionIds.districtId;
                } else if (scope.level === 'SUBDIVISION' && scope.jurisdictionIds.subDivisionId) {
                    where.subDivisionId = scope.jurisdictionIds.subDivisionId;
                } else if (scope.level === 'POLICE_STATION' && scope.jurisdictionIds.policeStationId) {
                    where.policeStationId = scope.jurisdictionIds.policeStationId;
                } else if (scope.level === 'BEAT' && scope.jurisdictionIds.beatId) {
                    where.beatId = scope.jurisdictionIds.beatId;
                }
            }

            const officers = await prisma.beatOfficer.findMany({
                where,
                include: {
                    Beat: {
                        include: {
                            _count: {
                                select: { SeniorCitizen: true }
                            }
                        }
                    },
                    _count: {
                        select: { Visit: true }
                    }
                }
            });

            const workloadData = officers.map(officer => ({
                officerId: officer.id,
                officerName: officer.name,
                badgeNumber: officer.badgeNumber,
                beatName: officer.Beat?.name || 'Unassigned',
                assignedCitizens: officer.Beat?._count?.SeniorCitizen || 0,
                totalVisits: officer._count.Visit,
                workloadScore: (officer.Beat?._count?.SeniorCitizen || 0) + (officer._count.Visit * 0.5)
            }));

            // Sort by workload score
            workloadData.sort((a, b) => b.workloadScore - a.workloadScore);

            res.json({
                success: true,
                data: { workloadDistribution: workloadData }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get officer statistics
     */
    static async getStatistics(req: Request, res: Response, next: NextFunction) {
        try {
            const where = buildWhereClause(req.query, {
                exactMatchFields: ['policeStationId']
            });

            // Apply Data Scope
            const scope = req.dataScope;
            if (scope && scope.level !== 'ALL') {
                if (scope.level === 'RANGE' && scope.jurisdictionIds.rangeId) {
                    where.rangeId = scope.jurisdictionIds.rangeId;
                } else if (scope.level === 'DISTRICT' && scope.jurisdictionIds.districtId) {
                    where.districtId = scope.jurisdictionIds.districtId;
                } else if (scope.level === 'SUBDIVISION' && scope.jurisdictionIds.subDivisionId) {
                    where.subDivisionId = scope.jurisdictionIds.subDivisionId;
                } else if (scope.level === 'POLICE_STATION' && scope.jurisdictionIds.policeStationId) {
                    where.policeStationId = scope.jurisdictionIds.policeStationId;
                } else if (scope.level === 'BEAT' && scope.jurisdictionIds.beatId) {
                    where.beatId = scope.jurisdictionIds.beatId;
                }
            }

            const [
                total,
                active,
                inactive,
                withBeat,
                withoutBeat
            ] = await Promise.all([
                prisma.beatOfficer.count({ where }),
                prisma.beatOfficer.count({ where: { ...where, isActive: true } }),
                prisma.beatOfficer.count({ where: { ...where, isActive: false } }),
                prisma.beatOfficer.count({ where: { ...where, beatId: { not: null } } }),
                prisma.beatOfficer.count({ where: { ...where, beatId: null } })
            ]);

            res.json({
                success: true,
                data: {
                    total,
                    active,
                    inactive,
                    withBeat,
                    withoutBeat
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Transfer officer to new beat with automatic citizen reassignment
     */
    static async transferOfficer(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { newBeatId, newPoliceStationId, effectiveDate, reason } = req.body;

            const officer = await prisma.beatOfficer.findUnique({
                where: { id },
                include: {
                    Beat: {
                        include: {
                            SeniorCitizen: {
                                where: { isActive: true },
                                select: { id: true, fullName: true }
                            }
                        }
                    },
                    Visit: {
                        where: { status: { in: ['SCHEDULED'] } }
                    }
                }
            });

            if (!officer) {
                throw new AppError('Officer not found', 404);
            }

            if (!officer.beatId) {
                throw new AppError('Officer has no current beat assignment', 400);
            }

            // Start transaction for atomic transfer
            const result = await prisma.$transaction(async (tx) => {
                const { OfficerTransferService } = await import('../services/officerTransferService');

                // 1. Record transfer history
                await tx.officerTransferHistory.create({
                    data: {
                        officerId: id,
                        fromBeatId: officer.beatId!,
                        toBeatId: newBeatId,
                        fromPoliceStationId: officer.policeStationId || '',
                        toPoliceStationId: newPoliceStationId,
                        effectiveDate: new Date(effectiveDate),
                        reason,
                        transferredBy: req.user?.email
                    }
                });

                // 2. Reassign all citizens to new officers in old beat
                const citizenIds = officer.Beat!.SeniorCitizen.map(c => c.id);
                const reassignmentResults = await OfficerTransferService.reassignCitizensToNewOfficers(
                    citizenIds,
                    officer.beatId!,
                    id
                );

                // 3. Handle scheduled visits
                const visitResults = await OfficerTransferService.handleOfficerTransferVisits(
                    officer.Visit,
                    reassignmentResults
                );

                // 4. Update officer's beat and PS
                const updatedOfficer = await tx.beatOfficer.update({
                    where: { id },
                    data: {
                        beatId: newBeatId,
                        policeStationId: newPoliceStationId,
                        updatedAt: new Date()
                    },
                    include: {
                        Beat: true,
                        PoliceStation: true
                    }
                });

                return {
                    officer: updatedOfficer,
                    citizensReassigned: reassignmentResults.filter(r => r.status === 'REASSIGNED').length,
                    citizensPendingManual: reassignmentResults.filter(r => r.status === 'PENDING_MANUAL_ASSIGNMENT').length,
                    visitsReassigned: visitResults.reassigned,
                    visitsCancelled: visitResults.cancelled,
                    reassignmentDetails: reassignmentResults
                };
            });

            auditLogger.info('Officer transferred successfully', {
                officerId: id,
                officerName: officer.name,
                fromBeat: officer.Beat?.name,
                toBeatId: newBeatId,
                ...result,
                transferredBy: req.user?.email
            });

            res.json({
                success: true,
                data: result,
                message: 'Officer transferred successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Preview transfer impact before execution
     */
    static async previewTransfer(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { newBeatId } = req.body;

            const { OfficerTransferService } = await import('../services/officerTransferService');
            const preview = await OfficerTransferService.previewTransfer(id, newBeatId);

            res.json(preview);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get transfer history for an officer
     */
    static async getTransferHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const history = await prisma.officerTransferHistory.findMany({
                where: { officerId: id },
                orderBy: { effectiveDate: 'desc' }
            });

            res.json({
                success: true,
                data: { history }
            });
        } catch (error) {
            next(error);
        }
    }
}
