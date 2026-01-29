import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class ReportController {
    /**
     * Get dashboard overview statistics
     */
    static async getDashboardStats(req: Request, res: Response, next: NextFunction) {
        try {
            const { policeStationId, beatId, startDate, endDate } = req.query;

            const citizenWhere: any = { isActive: true };
            const visitWhere: any = {};
            const sosWhere: any = {};
            const officerWhere: any = {};

            // Apply Data Scope (Jurisdiction Filtering)
            const scope = req.dataScope;
            if (scope && scope.level !== 'ALL') {
                if (scope.level === 'RANGE' && scope.jurisdictionIds.rangeId) {
                    citizenWhere.rangeId = scope.jurisdictionIds.rangeId;
                    officerWhere.rangeId = scope.jurisdictionIds.rangeId;
                } else if (scope.level === 'DISTRICT' && scope.jurisdictionIds.districtId) {
                    citizenWhere.districtId = scope.jurisdictionIds.districtId;
                    officerWhere.districtId = scope.jurisdictionIds.districtId;
                } else if (scope.level === 'SUBDIVISION' && scope.jurisdictionIds.subDivisionId) {
                    citizenWhere.subDivisionId = scope.jurisdictionIds.subDivisionId;
                    officerWhere.subDivisionId = scope.jurisdictionIds.subDivisionId;
                } else if (scope.level === 'POLICE_STATION' && scope.jurisdictionIds.policeStationId) {
                    citizenWhere.policeStationId = scope.jurisdictionIds.policeStationId;
                    officerWhere.policeStationId = scope.jurisdictionIds.policeStationId;
                } else if (scope.level === 'BEAT' && scope.jurisdictionIds.beatId) {
                    citizenWhere.beatId = scope.jurisdictionIds.beatId;
                    officerWhere.beatId = scope.jurisdictionIds.beatId;
                }
            }

            // Apply query parameter filters (these further narrow the scope)
            if (policeStationId) {
                citizenWhere.policeStationId = String(policeStationId);
                visitWhere.policeStationId = String(policeStationId);
                sosWhere.seniorCitizen = { policeStationId: String(policeStationId) };
                officerWhere.policeStationId = String(policeStationId);
            }

            if (beatId) {
                citizenWhere.beatId = String(beatId);
                visitWhere.beatId = String(beatId);
                sosWhere.seniorCitizen = { beatId: String(beatId) };
                officerWhere.beatId = String(beatId);
            }

            if (startDate || endDate) {
                visitWhere.scheduledDate = {};
                sosWhere.createdAt = {};
                if (startDate) {
                    visitWhere.scheduledDate.gte = new Date(String(startDate));
                    sosWhere.createdAt.gte = new Date(String(startDate));
                }
                if (endDate) {
                    visitWhere.scheduledDate.lte = new Date(String(endDate));
                    sosWhere.createdAt.lte = new Date(String(endDate));
                }
            }

            const [
                totalCitizens,
                verifiedCitizens,
                pendingCitizens,
                highVulnerability,
                totalOfficers,
                activeOfficers,
                totalVisits,
                scheduledVisits,
                inProgressVisits,
                completedVisits,
                cancelledVisits,
                totalSOS,
                activeSOS,
                resolvedSOS,
                recentActivities
            ] = await Promise.all([
                prisma.seniorCitizen.count({ where: citizenWhere }),
                prisma.seniorCitizen.count({ where: { ...citizenWhere, idVerificationStatus: 'Verified' } }),
                prisma.seniorCitizen.count({ where: { ...citizenWhere, idVerificationStatus: 'Pending' } }),
                prisma.seniorCitizen.count({ where: { ...citizenWhere, vulnerabilityLevel: 'High' } }),
                prisma.beatOfficer.count({ where: officerWhere }),
                prisma.beatOfficer.count({ where: { ...officerWhere, isActive: true } }),
                prisma.visit.count({ where: visitWhere }),
                prisma.visit.count({ where: { ...visitWhere, status: 'SCHEDULED' } }),
                prisma.visit.count({ where: { ...visitWhere, status: 'IN_PROGRESS' } }),
                prisma.visit.count({ where: { ...visitWhere, status: 'COMPLETED' } }),
                prisma.visit.count({ where: { ...visitWhere, status: 'CANCELLED' } }),
                prisma.sOSAlert.count({ where: sosWhere }),
                prisma.sOSAlert.count({ where: { ...sosWhere, status: 'Active' } }),
                prisma.sOSAlert.count({ where: { ...sosWhere, status: 'Resolved' } }),
                prisma.auditLog.findMany({
                    take: 10,
                    orderBy: { timestamp: 'desc' },
                    include: {
                        User: {
                            select: {
                                email: true,
                                role: true,
                                officerProfile: { select: { name: true, badgeNumber: true } }
                            }
                        }
                    }
                })
            ]);

            res.json({
                success: true,
                data: {
                    citizens: {
                        total: totalCitizens,
                        verified: verifiedCitizens,
                        pending: pendingCitizens,
                        highVulnerability
                    },
                    officers: {
                        total: totalOfficers,
                        active: activeOfficers
                    },
                    visits: {
                        total: totalVisits,
                        completed: completedVisits,
                        pending: scheduledVisits + inProgressVisits,
                        completionRate: totalVisits > 0 ? ((completedVisits / totalVisits) * 100).toFixed(2) : 0
                    },
                    sos: {
                        total: totalSOS,
                        active: activeSOS,
                        resolved: resolvedSOS,
                        resolutionRate: totalSOS > 0 ? ((resolvedSOS / totalSOS) * 100).toFixed(2) : 0
                    },
                    recentActivities: recentActivities.map(log => ({
                        id: log.id,
                        action: log.action,
                        resource: log.resource,
                        details: log.changes,
                        timestamp: log.timestamp,
                        user: log.User ? {
                            email: log.User.email,
                            role: log.User.role,
                            name: log.User.officerProfile?.name || log.User.email
                        } : null
                    }))
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get citizen demographics report
     */
    static async getCitizenDemographics(req: Request, res: Response, next: NextFunction) {
        try {
            const { policeStationId, beatId } = req.query;

            const where: any = { isActive: true };
            if (policeStationId) where.policeStationId = String(policeStationId);
            if (beatId) where.beatId = String(beatId);

            const citizens = await prisma.seniorCitizen.findMany({
                where,
                select: {
                    age: true,
                    gender: true,
                    vulnerabilityLevel: true,
                    livingArrangement: true,
                    maritalStatus: true
                }
            });

            // Age distribution
            const ageDistribution = {
                '60-70': citizens.filter(c => c.age && c.age >= 60 && c.age < 70).length,
                '70-80': citizens.filter(c => c.age && c.age >= 70 && c.age < 80).length,
                '80-90': citizens.filter(c => c.age && c.age >= 80 && c.age < 90).length,
                '90+': citizens.filter(c => c.age && c.age >= 90).length
            };

            // Gender distribution
            const genderDistribution = {
                Male: citizens.filter(c => c.gender === 'Male').length,
                Female: citizens.filter(c => c.gender === 'Female').length,
                Other: citizens.filter(c => c.gender === 'Other').length
            };

            // Vulnerability distribution
            const vulnerabilityDistribution = {
                Low: citizens.filter(c => c.vulnerabilityLevel === 'Low').length,
                Medium: citizens.filter(c => c.vulnerabilityLevel === 'Medium').length,
                High: citizens.filter(c => c.vulnerabilityLevel === 'High').length
            };

            // Living arrangement
            const livingArrangement = {
                Alone: citizens.filter(c => c.livingArrangement === 'Alone').length,
                'With Spouse': citizens.filter(c => c.livingArrangement === 'With Spouse').length,
                'With Family': citizens.filter(c => c.livingArrangement === 'With Family').length,
                Other: citizens.filter(c => c.livingArrangement === 'Other').length
            };

            res.json({
                success: true,
                data: {
                    total: citizens.length,
                    ageDistribution,
                    genderDistribution,
                    vulnerabilityDistribution,
                    livingArrangement
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get visit analytics
     */
    static async getVisitAnalytics(req: Request, res: Response, next: NextFunction) {
        try {
            const { policeStationId, beatId, startDate, endDate, groupBy = 'day' } = req.query;

            const where: any = {};
            if (policeStationId) where.policeStationId = String(policeStationId);
            if (beatId) where.beatId = String(beatId);

            const start = startDate ? new Date(String(startDate)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const end = endDate ? new Date(String(endDate)) : new Date();

            where.scheduledDate = { gte: start, lte: end };

            const visits = await prisma.visit.findMany({
                where,
                select: {
                    scheduledDate: true,
                    status: true,
                    visitType: true,
                    duration: true
                }
            });

            // Group by time period
            const timeline: Record<string, any> = {};
            visits.forEach(visit => {
                let key: string;
                const date = new Date(visit.scheduledDate);

                switch (groupBy) {
                    case 'month':
                        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        break;
                    case 'week':
                        const weekNumber = Math.ceil((date.getDate()) / 7);
                        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-W${weekNumber}`;
                        break;
                    case 'day':
                    default:
                        key = date.toISOString().split('T')[0];
                }

                if (!timeline[key]) {
                    timeline[key] = { total: 0, completed: 0, scheduled: 0, cancelled: 0 };
                }

                timeline[key].total++;
                if (visit.status === 'COMPLETED') timeline[key].completed++;
                if (visit.status === 'SCHEDULED') timeline[key].scheduled++;
                if (visit.status === 'CANCELLED') timeline[key].cancelled++;
            });

            // Average visit duration
            const completedVisits = visits.filter(v => v.status === 'COMPLETED' && v.duration);
            const avgDuration = completedVisits.length > 0
                ? completedVisits.reduce((sum, v) => sum + (v.duration || 0), 0) / completedVisits.length
                : 0;

            res.json({
                success: true,
                data: {
                    total: visits.length,
                    timeline,
                    byType: {
                        Routine: visits.filter(v => v.visitType === 'Routine').length,
                        Emergency: visits.filter(v => v.visitType === 'Emergency').length,
                        'Follow-up': visits.filter(v => v.visitType === 'Follow-up').length
                    },
                    byStatus: {
                        Scheduled: visits.filter(v => v.status === 'SCHEDULED').length,
                        'In Progress': visits.filter(v => v.status === 'IN_PROGRESS').length,
                        Completed: visits.filter(v => v.status === 'COMPLETED').length,
                        Cancelled: visits.filter(v => v.status === 'CANCELLED').length
                    },
                    avgDurationMinutes: Math.round(avgDuration)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get officer performance report
     */
    static async getOfficerPerformance(req: Request, res: Response, next: NextFunction) {
        try {
            const { policeStationId, startDate, endDate } = req.query;

            const where: any = { isActive: true };
            if (policeStationId) where.policeStationId = String(policeStationId);

            const officers = await prisma.beatOfficer.findMany({
                where,
                include: {
                    Visit: {
                        where: {
                            scheduledDate: {
                                gte: startDate ? new Date(String(startDate)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                                lte: endDate ? new Date(String(endDate)) : new Date()
                            }
                        }
                    },
                    Beat: {
                        include: {
                            _count: {
                                select: { SeniorCitizen: true }
                            }
                        }
                    }
                }
            });

            const performance = officers.map(officer => {
                const completedVisits = officer.Visit.filter((v: any) => v.status === 'COMPLETED').length;
                const totalVisits = officer.Visit.length;

                return {
                    officerId: officer.id,
                    officerName: officer.name,
                    badgeNumber: officer.badgeNumber,
                    beatName: officer.Beat?.name || 'Unassigned',
                    assignedCitizens: officer.Beat?._count.SeniorCitizen || 0,
                    totalVisits,
                    completedVisits,
                    completionRate: totalVisits > 0 ? ((completedVisits / totalVisits) * 100).toFixed(2) : 0,
                    emergencyVisits: officer.Visit.filter((v: any) => v.visitType === 'Emergency').length
                };
            });

            // Sort by performance
            performance.sort((a, b) => b.completedVisits - a.completedVisits);

            res.json({
                success: true,
                data: {
                    officers: performance,
                    summary: {
                        totalOfficers: officers.length,
                        avgVisitsPerOfficer: officers.length > 0 ? (performance.reduce((sum, o) => sum + o.totalVisits, 0) / officers.length).toFixed(2) : 0,
                        avgCompletionRate: officers.length > 0 ? (performance.reduce((sum, o) => sum + Number(o.completionRate), 0) / officers.length).toFixed(2) : 0
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Export data to CSV/Excel
     */
    static async exportData(req: Request, res: Response, next: NextFunction) {
        try {
            const { type, format = 'csv', policeStationId, startDate, endDate } = req.query;

            let data: any[] = [];
            let filename = '';

            switch (type) {
                case 'citizens':
                    const citizens = await prisma.seniorCitizen.findMany({
                        where: {
                            isActive: true,
                            ...(policeStationId ? { policeStationId: String(policeStationId) } : {})
                        },
                        select: {
                            fullName: true,
                            age: true,
                            gender: true,
                            mobileNumber: true,
                            permanentAddress: true,
                            vulnerabilityLevel: true,
                            idVerificationStatus: true,
                            createdAt: true
                        }
                    });
                    data = citizens;
                    filename = 'citizens_export';
                    break;

                case 'visits':
                    const visits = await prisma.visit.findMany({
                        where: {
                            ...(policeStationId ? { policeStationId: String(policeStationId) } : {}),
                            ...(startDate || endDate ? {
                                scheduledDate: {
                                    ...(startDate ? { gte: new Date(String(startDate)) } : {}),
                                    ...(endDate ? { lte: new Date(String(endDate)) } : {})
                                }
                            } : {})
                        },
                        include: {
                            SeniorCitizen: { select: { fullName: true } },
                            officer: { select: { name: true } }
                        }
                    });
                    data = visits.map((v: any) => ({
                        citizenName: v.SeniorCitizen.fullName,
                        officerName: v.officer.name,
                        scheduledDate: v.scheduledDate,
                        status: v.status,
                        visitType: v.visitType,
                        duration: v.duration
                    }));
                    filename = 'visits_export';
                    break;

                case 'sos':
                    const alerts = await prisma.sOSAlert.findMany({
                        where: {
                            ...(startDate || endDate ? {
                                createdAt: {
                                    ...(startDate ? { gte: new Date(String(startDate)) } : {}),
                                    ...(endDate ? { lte: new Date(String(endDate)) } : {})
                                }
                            } : {})
                        },
                        include: {
                            SeniorCitizen: { select: { fullName: true, mobileNumber: true } }
                        }
                    });
                    data = alerts.map((a: any) => ({
                        citizenName: a.SeniorCitizen.fullName,
                        citizenPhone: a.SeniorCitizen.mobileNumber,
                        latitude: a.latitude,
                        longitude: a.longitude,
                        status: a.status,
                        createdAt: a.createdAt,
                        resolvedAt: a.resolvedAt
                    }));
                    filename = 'sos_alerts_export';
                    break;

                default:
                    throw new AppError('Invalid export type', 400);
            }

            if (format === 'csv') {
                // Convert to CSV
                const headers = Object.keys(data[0] || {}).join(',');
                const rows = data.map(row => Object.values(row).join(','));
                const csv = [headers, ...rows].join('\n');

                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
                res.send(csv);
            } else {
                // Return JSON
                res.json({
                    success: true,
                    data,
                    total: data.length
                });
            }
        } catch (error) {
            next(error);
        }
    }
}
