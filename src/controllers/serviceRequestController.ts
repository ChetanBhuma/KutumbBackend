import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authenticate';

export class ServiceRequestController {
    /**
     * Create a new service request
     */
    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { seniorCitizenId, serviceType, requestType, description, priority } = req.body;

            const serviceRequest = await prisma.serviceRequest.create({
                data: {
                    seniorCitizenId,
                    serviceType: serviceType || requestType || 'General',
                    description,
                    priority: priority || 'Normal',
                    status: 'Pending'
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
            const { status, serviceType, requestType, priority, seniorCitizenId, policeStationId, page = 1, limit = 50 } = req.query;

            const where: any = {};
            if (status) {
                // Normalize status if passed with space
                const normalizedStatus = String(status).replace(' ', '_');
                where.status = normalizedStatus;
            }
            if (serviceType || requestType) {
                where.serviceType = serviceType || requestType;
            }
            if (priority) where.priority = priority;
            if (seniorCitizenId) where.seniorCitizenId = String(seniorCitizenId);

            // Apply Data Scope & Police Station filter
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

            if (policeStationId) {
                where.SeniorCitizen = {
                    ...(where.SeniorCitizen || {}),
                    policeStationId: String(policeStationId)
                };
            }

            const skip = (Number(page) - 1) * Number(limit);

            const [requests, total] = await Promise.all([
                prisma.serviceRequest.findMany({
                    where,
                    include: {
                        SeniorCitizen: {
                            select: {
                                id: true,
                                fullName: true,
                                mobileNumber: true,
                                permanentAddress: true,
                                vulnerabilityLevel: true,
                                policeStationId: true,
                                beatId: true
                            }
                        }
                    },
                    orderBy: [
                        { priority: 'desc' },
                        { createdAt: 'desc' }
                    ],
                    skip,
                    take: Number(limit)
                }),
                prisma.serviceRequest.count({ where })
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

            const serviceRequest = await prisma.serviceRequest.findUnique({
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
            const { status, assignedTo, resolution } = req.body;

            const updateData: any = {};
            if (status) {
                const normalizedStatus = String(status).replace(' ', '_');
                updateData.status = normalizedStatus;
                if (normalizedStatus === 'Resolved' || normalizedStatus === 'Closed') {
                    updateData.completedAt = new Date();
                }
            }
            if (assignedTo) updateData.assignedTo = assignedTo;
            if (resolution) updateData.resolution = resolution;

            const serviceRequest = await prisma.serviceRequest.update({
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
            const { officerId, assignedTo } = req.body;

            const serviceRequest = await prisma.serviceRequest.update({
                where: { id },
                data: {
                    assignedTo: officerId || assignedTo,
                    status: 'In_Progress'
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
                where.createdAt = {};
                if (startDate) where.createdAt.gte = new Date(String(startDate));
                if (endDate) where.createdAt.lte = new Date(String(endDate));
            }

            const [total, pending, inProgress, resolved] = await Promise.all([
                prisma.serviceRequest.count({ where }),
                prisma.serviceRequest.count({ where: { ...where, status: 'Pending' } }),
                prisma.serviceRequest.count({ where: { ...where, status: 'In_Progress' } }),
                prisma.serviceRequest.count({ where: { ...where, status: 'Resolved' } })
            ]);

            const byType = await prisma.serviceRequest.groupBy({
                by: ['serviceType'],
                where,
                _count: true
            });

            const byPriority = await prisma.serviceRequest.groupBy({
                by: ['priority'],
                where,
                _count: true
            });

            res.json({
                success: true,
                data: {
                    total,
                    byStatus: { pending, inProgress, resolved },
                    byType: byType.reduce((acc: any, item: any) => {
                        acc[item.serviceType] = item._count;
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

            await prisma.serviceRequest.delete({
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

