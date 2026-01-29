import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authenticate';
import { auditLogger } from '../config/logger';

const db = prisma as any;

export class LeaveController {
    /**
     * Create leave request
     */
    static async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { officerId, startDate, endDate, leaveType, reason } = req.body;

            // Validate dates
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (end <= start) {
                throw new AppError('End date must be after start date', 400);
            }

            // Check for overlapping leaves
            const overlapping = await db.officerLeave.findFirst({
                where: {
                    officerId,
                    status: { in: ['Pending', 'Approved'] },
                    OR: [
                        {
                            AND: [
                                { startDate: { lte: end } },
                                { endDate: { gte: start } }
                            ]
                        }
                    ]
                }
            });

            if (overlapping) {
                throw new AppError('Leave request overlaps with existing leave', 409);
            }

            // Check for scheduled visits during leave period
            const visitsConflict = await db.visit.count({
                where: {
                    officerId,
                    scheduledDate: {
                        gte: start,
                        lte: end
                    },
                    status: { in: ['Scheduled', 'In Progress'] }
                }
            });

            const leave = await db.officerLeave.create({
                data: {
                    officerId,
                    startDate: start,
                    endDate: end,
                    leaveType,
                    reason,
                    status: 'Pending'
                },
                include: {
                    officer: {
                        select: {
                            id: true,
                            name: true,
                            badgeNumber: true,
                            email: true
                        }
                    }
                }
            });

            auditLogger.info('Leave request created', {
                leaveId: leave.id,
                officerId,
                leaveType,
                createdBy: req.user?.email
            });

            res.status(201).json({
                success: true,
                data: {
                    leave,
                    warnings: visitsConflict > 0 ? {
                        message: `${visitsConflict} scheduled visit(s) during this period. Please reassign.`,
                        count: visitsConflict
                    } : null
                },
                message: 'Leave request created successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all leave requests with filters
     */
    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                officerId,
                status,
                leaveType,
                startDate,
                endDate,
                page = 1,
                limit = 50
            } = req.query;

            const where: any = {};

            if (officerId) where.officerId = String(officerId);
            if (status) where.status = String(status);
            if (leaveType) where.leaveType = String(leaveType);

            if (startDate || endDate) {
                where.AND = [];
                if (startDate) {
                    where.AND.push({ startDate: { gte: new Date(String(startDate)) } });
                }
                if (endDate) {
                    where.AND.push({ endDate: { lte: new Date(String(endDate)) } });
                }
            }

            const skip = (Number(page) - 1) * Number(limit);

            const [leaves, total] = await Promise.all([
                db.officerLeave.findMany({
                    where,
                    include: {
                        officer: {
                            select: {
                                id: true,
                                name: true,
                                badgeNumber: true,
                                email: true,
                                Beat: {
                                    select: { name: true }
                                }
                            }
                        },
                        approver: {
                            select: {
                                id: true,
                                email: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: Number(limit)
                }),
                db.officerLeave.count({ where })
            ]);

            res.json({
                success: true,
                data: {
                    leaves,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total,
                        pages: Math.ceil(total / Number(limit))
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get leave by ID
     */
    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const leave = await db.officerLeave.findUnique({
                where: { id },
                include: {
                    officer: {
                        select: {
                            id: true,
                            name: true,
                            badgeNumber: true,
                            email: true,
                            mobileNumber: true,
                            Beat: { select: { name: true } },
                            PoliceStation: { select: { name: true } }
                        }
                    },
                    approver: {
                        select: { id: true, email: true }
                    },
                    rejecter: {
                        select: { id: true, email: true }
                    }
                }
            });

            if (!leave) {
                throw new AppError('Leave request not found', 404);
            }

            // Get conflicting visits
            const conflictingVisits = await db.visit.findMany({
                where: {
                    officerId: leave.officerId,
                    scheduledDate: {
                        gte: leave.startDate,
                        lte: leave.endDate
                    },
                    status: { in: ['Scheduled', 'In Progress'] }
                },
                include: {
                    SeniorCitizen: {
                        select: {
                            fullName: true,
                            mobileNumber: true
                        }
                    }
                }
            });

            res.json({
                success: true,
                data: {
                    leave,
                    conflictingVisits
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Approve leave request
     */
    static async approve(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { comments } = req.body;

            const leave = await db.officerLeave.findUnique({
                where: { id },
                include: {
                    officer: { select: { name: true, email: true } }
                }
            });

            if (!leave) {
                throw new AppError('Leave request not found', 404);
            }

            if (leave.status !== 'Pending') {
                throw new AppError(`Cannot approve leave with status: ${leave.status}`, 400);
            }

            const updated = await db.officerLeave.update({
                where: { id },
                data: {
                    status: 'Approved',
                    approvedBy: req.user?.id,
                    approvedAt: new Date()
                },
                include: {
                    officer: { select: { name: true } }
                }
            });

            auditLogger.info('Leave approved', {
                leaveId: id,
                officerId: leave.officerId,
                approvedBy: req.user?.email,
                comments
            });

            res.json({
                success: true,
                data: updated,
                message: 'Leave request approved successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Reject leave request
     */
    static async reject(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { rejectionReason } = req.body;

            if (!rejectionReason) {
                throw new AppError('Rejection reason is required', 400);
            }

            const leave = await db.officerLeave.findUnique({
                where: { id }
            });

            if (!leave) {
                throw new AppError('Leave request not found', 404);
            }

            if (leave.status !== 'Pending') {
                throw new AppError(`Cannot reject leave with status: ${leave.status}`, 400);
            }

            const updated = await db.officerLeave.update({
                where: { id },
                data: {
                    status: 'Rejected',
                    rejectedBy: req.user?.id,
                    rejectionReason
                }
            });

            auditLogger.warn('Leave rejected', {
                leaveId: id,
                officerId: leave.officerId,
                rejectedBy: req.user?.email,
                reason: rejectionReason
            });

            res.json({
                success: true,
                data: updated,
                message: 'Leave request rejected'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cancel leave request
     */
    static async cancel(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const leave = await db.officerLeave.findUnique({
                where: { id }
            });

            if (!leave) {
                throw new AppError('Leave request not found', 404);
            }

            if (!['Pending', 'Approved'].includes(leave.status)) {
                throw new AppError(`Cannot cancel leave with status: ${leave.status}`, 400);
            }

            const updated = await db.officerLeave.update({
                where: { id },
                data: { status: 'Cancelled' }
            });

            auditLogger.info('Leave cancelled', {
                leaveId: id,
                officerId: leave.officerId,
                cancelledBy: req.user?.email
            });

            res.json({
                success: true,
                data: updated,
                message: 'Leave request cancelled'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get leave statistics
     */
    static async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const { officerId, startDate, endDate } = req.query;

            const where: any = {};
            if (officerId) where.officerId = String(officerId);
            if (startDate || endDate) {
                where.AND = [];
                if (startDate) where.AND.push({ startDate: { gte: new Date(String(startDate)) } });
                if (endDate) where.AND.push({ endDate: { lte: new Date(String(endDate)) } });
            }

            const [total, pending, approved, rejected, cancelled] = await Promise.all([
                db.officerLeave.count({ where }),
                db.officerLeave.count({ where: { ...where, status: 'Pending' } }),
                db.officerLeave.count({ where: { ...where, status: 'Approved' } }),
                db.officerLeave.count({ where: { ...where, status: 'Rejected' } }),
                db.officerLeave.count({ where: { ...where, status: 'Cancelled' } })
            ]);

            const byType = await db.officerLeave.groupBy({
                by: ['leaveType'],
                where,
                _count: true
            });

            res.json({
                success: true,
                data: {
                    total,
                    byStatus: { pending, approved, rejected, cancelled },
                    byType: byType.reduce((acc: any, item: any) => {
                        acc[item.leaveType] = item._count;
                        return acc;
                    }, {})
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get officer's leave balance/history
     */
    static async getOfficerLeaves(req: Request, res: Response, next: NextFunction) {
        try {
            const { officerId } = req.params;
            const { year } = req.query;

            const currentYear = year ? parseInt(String(year)) : new Date().getFullYear();
            const startOfYear = new Date(currentYear, 0, 1);
            const endOfYear = new Date(currentYear, 11, 31);

            const leaves = await db.officerLeave.findMany({
                where: {
                    officerId,
                    startDate: {
                        gte: startOfYear,
                        lte: endOfYear
                    }
                },
                orderBy: { startDate: 'asc' }
            });

            const stats = {
                total: leaves.length,
                approved: leaves.filter((l: any) => l.status === 'Approved').length,
                pending: leaves.filter((l: any) => l.status === 'Pending').length,
                rejected: leaves.filter((l: any) => l.status === 'Rejected').length,
                totalDays: leaves
                    .filter((l: any) => l.status === 'Approved')
                    .reduce((sum: number, l: any) => {
                        const days = Math.ceil((l.endDate - l.startDate) / (1000 * 60 * 60 * 24));
                        return sum + days;
                    }, 0)
            };

            res.json({
                success: true,
                data: {
                    leaves,
                    stats,
                    year: currentYear
                }
            });
        } catch (error) {
            next(error);
        }
    }
}
