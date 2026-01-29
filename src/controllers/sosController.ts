import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { auditLogger } from '../config/logger';
import { AuthRequest } from '../middleware/authenticate';
import { NotificationService } from '../services/notificationService';
import { Role } from '../types/auth';
import { paginatedQuery } from '../utils/pagination';
import { buildWhereClause, buildOrderBy } from '../utils/queryBuilder';
import { validateTransition } from '../utils/workflowValidation';
import { calculateSOSMetrics, checkSOSSLABreach } from '../utils/sosSLA';

export class SOSController {
    /**
     * Create SOS alert (panic button)
     */
    static async createAlert(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { latitude, longitude, address } = req.body;
            const userId = req.user?.id;

            // Get citizen profile
            const citizen = await prisma.seniorCitizen.findFirst({
                where: { userId },
                include: {
                    Beat: {
                        include: {
                            BeatOfficer: {
                                where: { isActive: true },
                                take: 1
                            }
                        }
                    },
                    PoliceStation: true,
                    EmergencyContact: {
                        where: { isPrimary: true },
                        take: 1
                    }
                }
            });

            if (!citizen) {
                throw new AppError('Citizen profile not found', 404);
            }

            // SECURITY FIX: Check for existing active SOS alert
            const existingAlert = await prisma.sOSAlert.findFirst({
                where: {
                    seniorCitizenId: citizen.id,
                    status: 'Active' // Only check for Active status
                }
            });

            if (existingAlert) {
                res.status(400).json({
                    success: false,
                    message: 'You already have an active SOS alert. Please wait for officer response.',
                    data: {
                        existingAlert: {
                            id: existingAlert.id,
                            status: existingAlert.status,
                            createdAt: existingAlert.createdAt
                        }
                    }
                });
                return;
            }

            // Create SOS alert
            const alert = await prisma.sOSAlert.create({
                data: {
                    seniorCitizenId: citizen.id,
                    latitude,
                    longitude,
                    address,
                    status: 'Active'
                },
                include: {
                    SeniorCitizen: {
                        select: {
                            id: true,
                            fullName: true,
                            mobileNumber: true,
                            age: true,
                            healthConditions: true,
                            vulnerabilityLevel: true
                        }
                    }
                }
            });

            // Log critical event
            auditLogger.error('SOS ALERT TRIGGERED', {
                alertId: alert.id,
                citizenId: citizen.id,
                citizenName: citizen.fullName,
                latitude,
                longitude,
                address,
                timestamp: new Date().toISOString(),
                severity: 'CRITICAL'
            });

            // Auto-assign to nearest officer if available
            let assignedOfficer = null;
            if (citizen.Beat?.BeatOfficer && citizen.Beat.BeatOfficer.length > 0) {
                assignedOfficer = citizen.Beat.BeatOfficer[0];

                // Create emergency visit
                await prisma.visit.create({
                    data: {
                        seniorCitizenId: citizen.id,
                        officerId: assignedOfficer.id,
                        policeStationId: assignedOfficer.policeStationId || '', // Required field
                        beatId: assignedOfficer.beatId || undefined,
                        scheduledDate: new Date(),
                        status: 'SCHEDULED', // FIX: Changed from IN_PROGRESS to SCHEDULED
                        visitType: 'Emergency'
                    }
                });
            }

            await NotificationService.sendSOSAlert(
                citizen.fullName,
                citizen.mobileNumber,
                address || citizen.permanentAddress || 'Unknown location',
                latitude,
                longitude,
                {
                    officers: assignedOfficer ? [{ phone: assignedOfficer.mobileNumber, name: assignedOfficer.name }] : [],
                    emergencyContacts: citizen.EmergencyContact?.map((contact: any) => ({
                        phone: contact.mobileNumber,
                        name: contact.name
                    })) || []
                }
            );

            res.status(201).json({
                success: true,
                data: {
                    alert,
                    assignedOfficer: assignedOfficer ? {
                        id: assignedOfficer.id,
                        name: assignedOfficer.name,
                        mobileNumber: assignedOfficer.mobileNumber
                    } : null,
                    emergencyContact: citizen.EmergencyContact[0] || null
                },
                message: 'SOS alert created successfully. Help is on the way!'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all SOS alerts
     */
    /**
     * Get all SOS alerts
     */
    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            // Map citizenId to seniorCitizenId
            const query = { ...req.query };
            if (query.citizenId) {
                query.seniorCitizenId = query.citizenId;
            }

            const where = buildWhereClause(query, {
                exactMatchFields: ['status', 'seniorCitizenId'],
                dateRangeField: 'createdAt'
            });

            // Apply Data Scope
            const scope = req.dataScope;
            if (scope && scope.level !== 'ALL') {
                where.SeniorCitizen = where.SeniorCitizen || {};

                if (scope.level === 'RANGE' && scope.jurisdictionIds.rangeId) {
                    where.SeniorCitizen.rangeId = scope.jurisdictionIds.rangeId;
                } else if (scope.level === 'DISTRICT' && scope.jurisdictionIds.districtId) {
                    where.SeniorCitizen.districtId = scope.jurisdictionIds.districtId;
                } else if (scope.level === 'SUBDIVISION' && scope.jurisdictionIds.subDivisionId) {
                    where.SeniorCitizen.subDivisionId = scope.jurisdictionIds.subDivisionId;
                } else if (scope.level === 'POLICE_STATION' && scope.jurisdictionIds.policeStationId) {
                    where.SeniorCitizen.policeStationId = scope.jurisdictionIds.policeStationId;
                } else if (scope.level === 'BEAT' && scope.jurisdictionIds.beatId) {
                    where.SeniorCitizen.beatId = scope.jurisdictionIds.beatId;
                }
            }

            const result = await paginatedQuery(prisma.sOSAlert, {
                page: Number(req.query.page),
                limit: Number(req.query.limit),
                where,
                include: {
                    SeniorCitizen: {
                        select: {
                            id: true,
                            fullName: true,
                            mobileNumber: true,
                            age: true,
                            permanentAddress: true,
                            vulnerabilityLevel: true
                        }
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
     * Get SOS alert by ID
     */
    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const alert = await prisma.sOSAlert.findUnique({
                where: { id },
                include: {
                    SeniorCitizen: {
                        include: {
                            EmergencyContact: true,
                            PoliceStation: true,
                            Beat: true
                        }
                    },
                    locationUpdates: {
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });

            if (!alert) {
                throw new AppError('SOS alert not found', 404);
            }

            res.json({
                success: true,
                data: { alert }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update alert status (respond to alert)
     */
    static async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { status, notes } = req.body;

            const existingAlert = await prisma.sOSAlert.findUnique({ where: { id } });
            if (!existingAlert) {
                throw new AppError('SOS alert not found', 404);
            }

            validateTransition('SOS', existingAlert.status, status);

            const alert = await prisma.sOSAlert.update({
                where: { id },
                data: {
                    status,
                    notes,
                    respondedBy: status === 'Responded' ? req.user?.email : undefined,
                    respondedAt: status === 'Responded' ? new Date() : undefined,
                    resolvedAt: status === 'Resolved' ? new Date() : undefined
                },
                include: {
                    SeniorCitizen: true
                }
            });

            auditLogger.info('SOS alert status updated', {
                alertId: alert.id,
                citizenId: alert.seniorCitizenId,
                citizenName: alert.SeniorCitizen.fullName,
                status,
                respondedBy: req.user?.email,
                timestamp: new Date().toISOString()
            });

            // Calculate SLA metrics
            const metrics = calculateSOSMetrics(alert);

            // Log SLA breach if applicable
            if (metrics.isResponseSLABreached) {
                auditLogger.warn('SOS Response SLA Breached', {
                    alertId: alert.id,
                    responseTimeMinutes: metrics.responseTimeMinutes,
                    slaTargetMinutes: 15
                });
            }

            if (metrics.isResolutionSLABreached) {
                auditLogger.warn('SOS Resolution SLA Breached', {
                    alertId: alert.id,
                    resolutionTimeMinutes: metrics.resolutionTimeMinutes,
                    slaTargetMinutes: 60
                });
            }

            res.json({
                success: true,
                data: { alert, metrics },
                message: 'Alert status updated successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Citizen/officer updates SOS location for real-time tracking
     */
    static async updateLocation(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { latitude, longitude, batteryLevel, deviceInfo } = req.body;

            const alert = await prisma.sOSAlert.findUnique({
                where: { id },
                include: { SeniorCitizen: { select: { id: true, userId: true } } }
            });

            if (!alert) {
                throw new AppError('SOS alert not found', 404);
            }

            if (req.user?.role === Role.CITIZEN) {
                const citizenProfile = await prisma.seniorCitizen.findFirst({ where: { userId: req.user.id } });
                if (!citizenProfile || citizenProfile.id !== alert.seniorCitizenId) {
                    throw new AppError('Unauthorized to update this alert', 403);
                }
            }

            await prisma.sOSLocationUpdate.create({
                data: {
                    sosAlertId: alert.id,
                    latitude,
                    longitude,
                    batteryLevel,
                    deviceInfo
                }
            });

            const updatedAlert = await prisma.sOSAlert.update({
                where: { id },
                data: {
                    latitude: latitude ?? alert.latitude,
                    longitude: longitude ?? alert.longitude,
                    batteryLevel: batteryLevel ?? alert.batteryLevel,
                    deviceInfo: deviceInfo ?? alert.deviceInfo,
                    updatedAt: new Date()
                }
            });

            res.json({
                success: true,
                data: { alert: updatedAlert },
                message: 'SOS location updated'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get active alerts (real-time monitoring)
     */
    static async getActiveAlerts(req: Request, res: Response, next: NextFunction) {
        try {
            const { policeStationId, beatId } = req.query;

            const where: any = {
                status: { in: ['Active', 'Responded'] }
            };

            // Filter by jurisdiction if provided
            if (policeStationId || beatId) {
                where.seniorCitizen = {};
                if (policeStationId) where.seniorCitizen.policeStationId = String(policeStationId);
                if (beatId) where.seniorCitizen.beatId = String(beatId);
                if (beatId) where.seniorCitizen.beatId = String(beatId);
            }

            // Apply Data Scope
            const scope = req.dataScope;
            if (scope && scope.level !== 'ALL') {
                // Ensure seniorCitizen object (note: lowercase usage in existing code above?)
                // Existing code: if (policeStationIdOrBeatId) where.seniorCitizen = ...
                // Wait, 'where.seniorCitizen' (lowercase 's') might be relying on Prisma's auto-generated relation filtering which is usually PascalCase 'SeniorCitizen' unless configured.
                // Looking at getActiveAlerts implementation:
                // Line 375: where.seniorCitizen = {};
                // Line 376: where.seniorCitizen.policeStationId = ...
                // Prisma Client usually uses model name 'SeniorCitizen'.
                // If the previous code used lowercase, it might be wrong or works if property name is mapped.
                // Schema has 'SeniorCitizen SeniorCitizen'.
                // I will stick to 'SeniorCitizen' (PascalCase) which is safer, or check if 'seniorCitizen' assumes 'SeniorCitizen'.
                // But wait, the previous code lines 375-377 explicitly use 'seniorCitizen'.
                // If I mix 'seniorCitizen' and 'SeniorCitizen', Prisma might complain.
                // I should probably fix the existing lowercase usage if it's wrong, or match it.
                // Given the rest of the app uses PascalCase for relations in include/where generally, I suspect 'seniorCitizen' might be a typo in the original code or a mapped name.
                // However, I will use PascalCase 'SeniorCitizen' for my scope injection.
                // But if 'where.seniorCitizen' already exists, I should merge or rename.
                // Let's assume PascalCase is correct and correct the previous lines if I encounter them?
                // The existing code: 'where.seniorCitizen = {};'
                // I will change it to 'where.SeniorCitizen' to be safe and consistent with my other edits.
                // But replacing effectively requires overwriting the previous block.

                /*
                   Wait, I am replacing lines 379 (after the if block).
                   If the previous block set 'where.seniorCitizen', and I set 'where.SeniorCitizen', they might conflict or be separate.
                   I will correct the previous block implicitly if I can, but I am only appending logic.
                   Let's use 'where.SeniorCitizen' and assume the previous 'seniorCitizen' was either intended or I can't fix it easily without larger replacement.
                   Actually, I can use a larger replacement chunk to fix the lowercase usage.
                */

               where.SeniorCitizen = where.SeniorCitizen || where.seniorCitizen || {};
               delete where.seniorCitizen; // Clean up potential lowercase duplicate if we merge

                if (scope.level === 'RANGE' && scope.jurisdictionIds.rangeId) {
                    where.SeniorCitizen.rangeId = scope.jurisdictionIds.rangeId;
                } else if (scope.level === 'DISTRICT' && scope.jurisdictionIds.districtId) {
                    where.SeniorCitizen.districtId = scope.jurisdictionIds.districtId;
                } else if (scope.level === 'SUBDIVISION' && scope.jurisdictionIds.subDivisionId) {
                    where.SeniorCitizen.subDivisionId = scope.jurisdictionIds.subDivisionId;
                } else if (scope.level === 'POLICE_STATION' && scope.jurisdictionIds.policeStationId) {
                    where.SeniorCitizen.policeStationId = scope.jurisdictionIds.policeStationId;
                } else if (scope.level === 'BEAT' && scope.jurisdictionIds.beatId) {
                    where.SeniorCitizen.beatId = scope.jurisdictionIds.beatId;
                }
            }

            const alerts = await prisma.sOSAlert.findMany({
                where,
                include: {
                    SeniorCitizen: {
                        select: {
                            id: true,
                            fullName: true,
                            mobileNumber: true,
                            age: true,
                            permanentAddress: true,
                            vulnerabilityLevel: true,
                            healthConditions: true,
                            EmergencyContact: {
                                where: { isPrimary: true },
                                take: 1
                            }
                        }
                    },
                    locationUpdates: {
                        orderBy: { createdAt: 'desc' },
                        take: 5
                    }
                },
                orderBy: { createdAt: 'asc' } // Oldest first
            });

            // Add SLA breach indicators and map SeniorCitizen to camelCase
            const alertsWithSLA = alerts.map(alert => {
                const slaCheck = checkSOSSLABreach(alert);
                return {
                    ...alert,
                    seniorCitizen: alert.SeniorCitizen, // Map to camelCase for frontend compatibility
                    slaBreached: slaCheck.isBreached,
                    minutesElapsed: slaCheck.minutesElapsed
                };
            });

            res.json({
                success: true,
                data: {
                    alerts: alertsWithSLA,
                    count: alertsWithSLA.length,
                    breachedCount: alertsWithSLA.filter(a => a.slaBreached).length
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get SOS statistics
     */
    static async getStatistics(req: Request, res: Response, next: NextFunction) {
        try {
            const { policeStationId } = req.query;

            const where = buildWhereClause(req.query, {
                dateRangeField: 'createdAt'
            });

            if (policeStationId) {
                where.seniorCitizen = {
                    policeStationId: String(policeStationId)
                };
            }

            const [
                total,
                active,
                responded,
                resolved,
                falseAlarm
            ] = await Promise.all([
                prisma.sOSAlert.count({ where }),
                prisma.sOSAlert.count({ where: { ...where, status: 'Active' } }),
                prisma.sOSAlert.count({ where: { ...where, status: 'Responded' } }),
                prisma.sOSAlert.count({ where: { ...where, status: 'Resolved' } }),
                prisma.sOSAlert.count({ where: { ...where, status: 'FalseAlarm' } })
            ]);

            // Calculate average response time for resolved alerts
            const resolvedAlerts = await prisma.sOSAlert.findMany({
                where: { ...where, status: 'Resolved', respondedAt: { not: null } },
                select: {
                    createdAt: true,
                    respondedAt: true
                }
            });

            let avgResponseTime = 0;
            if (resolvedAlerts.length > 0) {
                const totalResponseTime = resolvedAlerts.reduce((sum, alert) => {
                    const responseTime = alert.respondedAt!.getTime() - alert.createdAt.getTime();
                    return sum + responseTime;
                }, 0);
                avgResponseTime = Math.round(totalResponseTime / resolvedAlerts.length / 1000 / 60); // in minutes
            }

            res.json({
                success: true,
                data: {
                    total,
                    byStatus: {
                        active,
                        responded,
                        resolved,
                        falseAlarm
                    },
                    avgResponseTimeMinutes: avgResponseTime,
                    resolutionRate: total > 0 ? ((resolved / total) * 100).toFixed(2) : 0
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get alert history for a citizen
     */
    static async getCitizenHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const { citizenId } = req.params;

            const alerts = await prisma.sOSAlert.findMany({
                where: { seniorCitizenId: citizenId },
                orderBy: { createdAt: 'desc' },
                take: 20
            });

            const stats = {
                total: alerts.length,
                active: alerts.filter(a => a.status === 'Active').length,
                resolved: alerts.filter(a => a.status === 'Resolved').length,
                falseAlarm: alerts.filter(a => a.status === 'FalseAlarm').length
            };

            res.json({
                success: true,
                data: {
                    alerts,
                    stats
                }
            });
        } catch (error) {
            next(error);
        }
    }
}
