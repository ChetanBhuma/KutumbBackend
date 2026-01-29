import { Prisma } from '@prisma/client';

/**
 * Prisma middleware to automatically filter soft-deleted records
 * Applies to models with 'isActive' field
 */
export const softDeleteMiddleware: Prisma.Middleware = async (params, next) => {
    // Models that support soft delete
    const softDeleteModels = ['seniorCitizen', 'beat', 'beatOfficer', 'user'];

    if (softDeleteModels.includes(params.model?.toLowerCase() || '')) {
        // Auto-filter for read operations
        if (params.action === 'findUnique' || params.action === 'findFirst') {
            params.action = 'findFirst';
            params.args.where = {
                ...params.args.where,
                isActive: params.args.where?.isActive !== false ? true : params.args.where.isActive
            };
        }

        if (params.action === 'findMany') {
            if (params.args.where) {
                if (params.args.where.isActive === undefined) {
                    params.args.where.isActive = true;
                }
            } else {
                params.args.where = { isActive: true };
            }
        }

        // Convert delete to soft delete
        if (params.action === 'delete') {
            params.action = 'update';
            params.args.data = { isActive: false };
        }

        if (params.action === 'deleteMany') {
            params.action = 'updateMany';
            params.args.data = { isActive: false };
        }
    }

    return next(params);
};

/**
 * Performance monitoring middleware
 * Logs slow queries
 */
export const performanceMiddleware: Prisma.Middleware = async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    const duration = after - before;

    // Log queries taking more than 100ms
    if (duration > 100) {
        console.warn(`Slow query detected: ${params.model}.${params.action} took ${duration}ms`);
    }

    return result;
};
