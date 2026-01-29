"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditController = void 0;
const database_1 = require("../config/database");
const pagination_1 = require("../utils/pagination");
const queryBuilder_1 = require("../utils/queryBuilder");
class AuditController {
    /**
     * Get paginated audit logs
     */
    static async getLogs(req, res, next) {
        try {
            const where = (0, queryBuilder_1.buildWhereClause)(req.query, {
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
            const result = await (0, pagination_1.paginatedQuery)(database_1.prisma.auditLog, {
                page: Number(req.query.page),
                limit: Number(req.query.limit),
                where,
                include: {
                    User: {
                        select: { email: true, role: true, officerId: true }
                    }
                },
                orderBy: (0, queryBuilder_1.buildOrderBy)(req.query, { timestamp: 'desc' })
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
}
exports.AuditController = AuditController;
//# sourceMappingURL=auditController.js.map