import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authenticate';

const db = prisma as any;

export class ServiceRequestController {
    /**
     * Create a new service request
     */
    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { seniorCitizenId, requestType, description, priority } = req.body;

            const serviceRequest = await db.serviceRequest.create({
                data: {
                    seniorCitizenId,
                    requestType, // 'HEALTH', 'EMERGENCY', 'WELFARE', 'DOCUMENT', 'OTHER'
                    description,
                    priority: priority || 'Medium',
                    status: 'Pending',
                    requestedAt: new Date()
                },
                include: {
                    SeniorCitizen: {
                        select: { fullName: true, mobileNumber: true, permanentAddress: true }
                    }
                }
            });

            res.status(201).json({
                success: true,
                data: serviceRequest,
                message: 'Service request created successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all service requests with filters
     */
    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            const { status, requestType, priority, seniorCitizenId, page = 1, limit = 50 } = req.query;

            const where: any = {};
            if (status) where.status = status;
            if (requestType) where.requestType = requestType;
            if (priority) where.priority = priority;
            if (seniorCitizenId) where.seniorCitizenId = seniorCitizenId;

            // Apply Data Scope
            const scope = req.dataScope;
            if (scope && scope.level !== 'ALL') {
                // Ensure SeniorCitizen relation object exists if not present (not needed if filtering root fields, but here we filter relation)
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

            const skip = (Number(page) - 1) * Number(limit);

            const [requests, total] = await Promise.all([
                db.serviceRequest.findMany({
                    where,
                    include: {
                        SeniorCitizen: {
                            select: {
                                fullName: true,
                                mobileNumber: true,
                                permanentAddress: true,
                                vulnerabilityLevel: true
                            }
                        }
                    },
                    orderBy: [
                        { priority: 'desc' },
                        { requestedAt: 'desc' }
                    ],
                    skip,
                    take: Number(limit)
                }),
                db.serviceRequest.count({ where })
            ]);

            res.json({
                success: true,
                data: {
                    requests,
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
     * Get request by ID
     */
    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const serviceRequest = await db.serviceRequest.findUnique({
                where: { id },
                include: {
                    SeniorCitizen: {
                        select: {
                            id: true,
                            fullName: true,
                            mobileNumber: true,
                            permanentAddress: true,
                            vulnerabilityLevel: true,
                            age: true
                        }
                    }
                }
            });

            if (!serviceRequest) {
                throw new AppError('Service request not found', 404);
            }

            res.json({
                success: true,
                data: serviceRequest
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update service request status
     */
    static async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { status, assignedTo, notes, resolution } = req.body;

            const updateData: any = {};
            if (status) updateData.status = status;
            if (assignedTo) updateData.assignedTo = assignedTo;
            if (notes) updateData.notes = notes;
            if (resolution) updateData.resolution = resolution;

            if (status === 'Completed') {
                updateData.completedAt = new Date();
                updateData.completedBy = req.user?.id;
            }

            const serviceRequest = await db.serviceRequest.update({
                where: { id },
                data: updateData,
                include: {
                    SeniorCitizen: {
                        select: { fullName: true, mobileNumber: true }
                    }
                }
            });

            res.json({
                success: true,
                data: serviceRequest,
                message: 'Service request updated successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Assign request to officer
     */
    static async assign(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { officerId } = req.body;

            const serviceRequest = await db.serviceRequest.update({
                where: { id },
                data: {
                    assignedTo: officerId,
                    status: 'In Progress',
                    assignedAt: new Date()
                }
            });

            res.json({
                success: true,
                data: serviceRequest,
                message: 'Service request assigned successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get statistics
     */
    static async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const { startDate, endDate } = req.query;

            const where: any = {};
            if (startDate || endDate) {
                where.requestedAt = {};
                if (startDate) where.requestedAt.gte = new Date(String(startDate));
                if (endDate) where.requestedAt.lte = new Date(String(endDate));
            }

            const [total, pending, inProgress, completed] = await Promise.all([
                db.serviceRequest.count({ where }),
                db.serviceRequest.count({ where: { ...where, status: 'Pending' } }),
                db.serviceRequest.count({ where: { ...where, status: 'In Progress' } }),
                db.serviceRequest.count({ where: { ...where, status: 'Completed' } })
            ]);

            const byType = await db.serviceRequest.groupBy({
                by: ['requestType'],
                where,
                _count: true
            });

            const byPriority = await db.serviceRequest.groupBy({
                by: ['priority'],
                where,
                _count: true
            });

            res.json({
                success: true,
                data: {
                    total,
                    byStatus: { pending, inProgress, completed },
                    byType: byType.reduce((acc: any, item: any) => {
                        acc[item.requestType] = item._count;
                        return acc;
                    }, {}),
                    byPriority: byPriority.reduce((acc: any, item: any) => {
                        acc[item.priority] = item._count;
                        return acc;
                    }, {})
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete service request
     */
    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            await db.serviceRequest.delete({
                where: { id }
            });

            res.json({
                success: true,
                message: 'Service request deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}
