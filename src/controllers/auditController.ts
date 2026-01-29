import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

import { paginatedQuery } from '../utils/pagination';
import { buildWhereClause, buildOrderBy } from '../utils/queryBuilder';

export class AuditController {
    /**
     * Get paginated audit logs
     */
    static async getLogs(req: Request, res: Response, next: NextFunction) {
        try {
            const where = buildWhereClause(req.query, {
                searchFields: ['action', 'resource', 'userId', 'ipAddress'],
                exactMatchFields: ['action', 'resource'],
            });

            // Add date range filter if provided
            if (req.query.startDate || req.query.endDate) {
                where.timestamp = {};
                if (req.query.startDate) {
                    where.timestamp.gte = new Date(String(req.query.startDate));
                }
                if (req.query.endDate) {
                    where.timestamp.lte = new Date(String(req.query.endDate));
                }
            }

            const result = await paginatedQuery(prisma.auditLog, {
                page: Number(req.query.page),
                limit: Number(req.query.limit),
                where,
                include: {
                    User: {
                        select: { email: true, role: true, officerId: true }
                    }
                },
                orderBy: buildOrderBy(req.query, { timestamp: 'desc' })
            });

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}
