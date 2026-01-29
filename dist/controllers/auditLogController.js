"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogController = void 0;
const database_1 = require("../config/database");
const pagination_1 = require("../utils/pagination");
class AuditLogController {
    /**
     * Get audit logs with filtering and pagination
     */
    static async getLogs(req, res, next) {
        try {
            const { page = 1, limit = 20, userId, action, entityType, entityId, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
            const where = {};
            if (userId)
                where.userId = userId;
            if (action)
                where.action = { contains: action };
            if (entityType)
                where.entityType = entityType;
            if (entityId)
                where.entityId = entityId;
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate)
                    where.createdAt.gte = new Date(startDate);
                if (endDate)
                    where.createdAt.lte = new Date(endDate);
            }
            const result = await (0, pagination_1.paginatedQuery)({
                model: 'auditLog',
                where,
                orderBy: { [sortBy]: sortOrder },
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get audit log entry by ID
     */
    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const log = await database_1.prisma.auditLog.findUnique({
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
        }
        catch (error) {
            return next(error);
        }
    }
}
exports.AuditLogController = AuditLogController;
//# sourceMappingURL=auditLogController.js.map