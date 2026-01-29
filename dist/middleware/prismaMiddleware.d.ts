import { Prisma } from '@prisma/client';
/**
 * Prisma middleware to automatically filter soft-deleted records
 * Applies to models with 'isActive' field
 */
export declare const softDeleteMiddleware: Prisma.Middleware;
/**
 * Performance monitoring middleware
 * Logs slow queries
 */
export declare const performanceMiddleware: Prisma.Middleware;
//# sourceMappingURL=prismaMiddleware.d.ts.map