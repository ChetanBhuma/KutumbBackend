import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/authenticate';
import { paginatedQuery } from '../utils/pagination';

export class AuditLogController {
    /**
     * Get audit logs with filtering and pagination
     */
    static async getLogs(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const {
                page = 1,
                limit = 20,
                userId,
                action,
                entityType,
                entityId,
                startDate,
                endDate,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            const where: any = {};

            if (userId) where.userId = userId as string;
            if (action) where.action = { contains: action as string };
            if (entityType) where.entityType = entityType as string;
            if (entityId) where.entityId = entityId as string;

            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) where.createdAt.gte = new Date(startDate as string);
                if (endDate) where.createdAt.lte = new Date(endDate as string);
            }

            const result = await paginatedQuery({
                model: 'auditLog',
                where,
                orderBy: { [sortBy as string]: sortOrder },
                page: Number(page),
                limit: Number(limit),
                include: {
                    User: {
                        select: {
                            email: true,
                            phone: true,
                            role: true
                        }
                    }
                }
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
     * Get audit log entry by ID
     */
    static async getById(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const log = await prisma.auditLog.findUnique({
                where: { id },
                include: {
                    User: {
                        select: {
                            email: true,
                            phone: true,
                            role: true
                        }
                    }
                }
            });

            if (!log) {
                return res.status(404).json({
                    success: false,
                    message: 'Audit log not found'
                });
            }

            return res.json({
                success: true,
                data: { log }
            });
        } catch (error) {
            return next(error);
        }
    }
}
