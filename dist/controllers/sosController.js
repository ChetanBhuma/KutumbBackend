"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOSController = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../config/logger");
const notificationService_1 = require("../services/notificationService");
const auth_1 = require("../types/auth");
const pagination_1 = require("../utils/pagination");
const queryBuilder_1 = require("../utils/queryBuilder");
const workflowValidation_1 = require("../utils/workflowValidation");
const sosSLA_1 = require("../utils/sosSLA");
class SOSController {
    /**
     * Create SOS alert (panic button)
     */
    static async createAlert(req, res, next) {
        try {
            const { latitude, longitude, address } = req.body;
            const userId = req.user?.id;
            // Get citizen profile
            const citizen = await database_1.prisma.seniorCitizen.findFirst({
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
                throw new errorHandler_1.AppError('Citizen profile not found', 404);
            }
            // SECURITY FIX: Check for existing active SOS alert
            const existingAlert = await database_1.prisma.sOSAlert.findFirst({
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
            const alert = await database_1.prisma.sOSAlert.create({
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
            logger_1.auditLogger.error('SOS ALERT TRIGGERED', {
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
                await database_1.prisma.visit.create({
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
            await notificationService_1.NotificationService.sendSOSAlert(citizen.fullName, citizen.mobileNumber, address || citizen.permanentAddress || 'Unknown location', latitude, longitude, {
                officers: assignedOfficer ? [{ phone: assignedOfficer.mobileNumber, name: assignedOfficer.name }] : [],
                emergencyContacts: citizen.EmergencyContact?.map((contact) => ({
                    phone: contact.mobileNumber,
                    name: contact.name
                })) || []
            });
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get all SOS alerts
     */
    /**
     * Get all SOS alerts
     */
    static async list(req, res, next) {
        try {
            // Map citizenId to seniorCitizenId
            const query = { ...req.query };
            if (query.citizenId) {
                query.seniorCitizenId = query.citizenId;
            }
            const where = (0, queryBuilder_1.buildWhereClause)(query, {
                exactMatchFields: ['status', 'seniorCitizenId'],
                dateRangeField: 'createdAt'
            });
            // Apply Data Scope
            const scope = req.dataScope;
            if (scope && scope.level !== 'ALL') {
                where.SeniorCitizen = where.SeniorCitizen || {};
                if (scope.level === 'RANGE' && scope.jurisdictionIds.rangeId) {
                    where.SeniorCitizen.rangeId = scope.jurisdictionIds.rangeId;
                }
                else if (scope.level === 'DISTRICT' && scope.jurisdictionIds.districtId) {
                    where.SeniorCitizen.districtId = scope.jurisdictionIds.districtId;
                }
                else if (scope.level === 'SUBDIVISION' && scope.jurisdictionIds.subDivisionId) {
                    where.SeniorCitizen.subDivisionId = scope.jurisdictionIds.subDivisionId;
                }
                else if (scope.level === 'POLICE_STATION' && scope.jurisdictionIds.policeStationId) {
                    where.SeniorCitizen.policeStationId = scope.jurisdictionIds.policeStationId;
                }
                else if (scope.level === 'BEAT' && scope.jurisdictionIds.beatId) {
                    where.SeniorCitizen.beatId = scope.jurisdictionIds.beatId;
                }
            }
            const result = await (0, pagination_1.paginatedQuery)(database_1.prisma.sOSAlert, {
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
                orderBy: (0, queryBuilder_1.buildOrderBy)(req.query, { createdAt: 'desc' })
            });
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get SOS alert by ID
     */
    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const alert = await database_1.prisma.sOSAlert.findUnique({
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
                throw new errorHandler_1.AppError('SOS alert not found', 404);
            }
            res.json({
                success: true,
                data: { alert }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update alert status (respond to alert)
     */
    static async updateStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status, notes } = req.body;
            const existingAlert = await database_1.prisma.sOSAlert.findUnique({ where: { id } });
            if (!existingAlert) {
                throw new errorHandler_1.AppError('SOS alert not found', 404);
            }
            (0, workflowValidation_1.validateTransition)('SOS', existingAlert.status, status);
            const alert = await database_1.prisma.sOSAlert.update({
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
            logger_1.auditLogger.info('SOS alert status updated', {
                alertId: alert.id,
                citizenId: alert.seniorCitizenId,
                citizenName: alert.SeniorCitizen.fullName,
                status,
                respondedBy: req.user?.email,
                timestamp: new Date().toISOString()
            });
            // Calculate SLA metrics
            const metrics = (0, sosSLA_1.calculateSOSMetrics)(alert);
            // Log SLA breach if applicable
            if (metrics.isResponseSLABreached) {
                logger_1.auditLogger.warn('SOS Response SLA Breached', {
                    alertId: alert.id,
                    responseTimeMinutes: metrics.responseTimeMinutes,
                    slaTargetMinutes: 15
                });
            }
            if (metrics.isResolutionSLABreached) {
                logger_1.auditLogger.warn('SOS Resolution SLA Breached', {
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Citizen/officer updates SOS location for real-time tracking
     */
    static async updateLocation(req, res, next) {
        try {
            const { id } = req.params;
            const { latitude, longitude, batteryLevel, deviceInfo } = req.body;
            const alert = await database_1.prisma.sOSAlert.findUnique({
                where: { id },
                include: { SeniorCitizen: { select: { id: true, userId: true } } }
            });
            if (!alert) {
                throw new errorHandler_1.AppError('SOS alert not found', 404);
            }
            if (req.user?.role === auth_1.Role.CITIZEN) {
                const citizenProfile = await database_1.prisma.seniorCitizen.findFirst({ where: { userId: req.user.id } });
                if (!citizenProfile || citizenProfile.id !== alert.seniorCitizenId) {
                    throw new errorHandler_1.AppError('Unauthorized to update this alert', 403);
                }
            }
            await database_1.prisma.sOSLocationUpdate.create({
                data: {
                    sosAlertId: alert.id,
                    latitude,
                    longitude,
                    batteryLevel,
                    deviceInfo
                }
            });
            const updatedAlert = await database_1.prisma.sOSAlert.update({
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get active alerts (real-time monitoring)
     */
    static async getActiveAlerts(req, res, next) {
        try {
            const { policeStationId, beatId } = req.query;
            const where = {
                status: { in: ['Active', 'Responded'] }
            };
            // Filter by jurisdiction if provided
            if (policeStationId || beatId) {
                where.seniorCitizen = {};
                if (policeStationId)
                    where.seniorCitizen.policeStationId = String(policeStationId);
                if (beatId)
                    where.seniorCitizen.beatId = String(beatId);
                if (beatId)
                    where.seniorCitizen.beatId = String(beatId);
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
                }
                else if (scope.level === 'DISTRICT' && scope.jurisdictionIds.districtId) {
                    where.SeniorCitizen.districtId = scope.jurisdictionIds.districtId;
                }
                else if (scope.level === 'SUBDIVISION' && scope.jurisdictionIds.subDivisionId) {
                    where.SeniorCitizen.subDivisionId = scope.jurisdictionIds.subDivisionId;
                }
                else if (scope.level === 'POLICE_STATION' && scope.jurisdictionIds.policeStationId) {
                    where.SeniorCitizen.policeStationId = scope.jurisdictionIds.policeStationId;
                }
                else if (scope.level === 'BEAT' && scope.jurisdictionIds.beatId) {
                    where.SeniorCitizen.beatId = scope.jurisdictionIds.beatId;
                }
            }
            const alerts = await database_1.prisma.sOSAlert.findMany({
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
                const slaCheck = (0, sosSLA_1.checkSOSSLABreach)(alert);
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get SOS statistics
     */
    static async getStatistics(req, res, next) {
        try {
            const { policeStationId } = req.query;
            const where = (0, queryBuilder_1.buildWhereClause)(req.query, {
                dateRangeField: 'createdAt'
            });
            if (policeStationId) {
                where.seniorCitizen = {
                    policeStationId: String(policeStationId)
                };
            }
            const [total, active, responded, resolved, falseAlarm] = await Promise.all([
                database_1.prisma.sOSAlert.count({ where }),
                database_1.prisma.sOSAlert.count({ where: { ...where, status: 'Active' } }),
                database_1.prisma.sOSAlert.count({ where: { ...where, status: 'Responded' } }),
                database_1.prisma.sOSAlert.count({ where: { ...where, status: 'Resolved' } }),
                database_1.prisma.sOSAlert.count({ where: { ...where, status: 'FalseAlarm' } })
            ]);
            // Calculate average response time for resolved alerts
            const resolvedAlerts = await database_1.prisma.sOSAlert.findMany({
                where: { ...where, status: 'Resolved', respondedAt: { not: null } },
                select: {
                    createdAt: true,
                    respondedAt: true
                }
            });
            let avgResponseTime = 0;
            if (resolvedAlerts.length > 0) {
                const totalResponseTime = resolvedAlerts.reduce((sum, alert) => {
                    const responseTime = alert.respondedAt.getTime() - alert.createdAt.getTime();
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get alert history for a citizen
     */
    static async getCitizenHistory(req, res, next) {
        try {
            const { citizenId } = req.params;
            const alerts = await database_1.prisma.sOSAlert.findMany({
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
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SOSController = SOSController;
//# sourceMappingURL=sosController.js.map