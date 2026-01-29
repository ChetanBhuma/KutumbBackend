"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginatedQuery = paginatedQuery;
exports.extractPaginationParams = extractPaginationParams;
exports.buildWhereClause = buildWhereClause;
/**
 * Reusable pagination utility for Prisma queries
 * Eliminates repeated pagination logic in 15+ controllers
 *
 * @example
 * const result = await paginatedQuery(prisma.seniorCitizen, {
 *   page: 1,
 *   limit: 20,
 *   where: { isActive: true },
 *   include: { policeStation: true },
 *   orderBy: { createdAt: 'desc' }
 * });
 */
async function paginatedQuery(model, options = {}) {
    const { page = 1, limit = 20, where = {}, include, orderBy, select } = options;
    // Ensure page and limit are positive integers (handle NaN gracefully)
    const rawPage = Number(page);
    const rawLimit = Number(limit);
    const currentPage = isNaN(rawPage) ? 1 : Math.max(1, rawPage);
    const pageSize = isNaN(rawLimit) ? 20 : Math.max(1, Math.min(2000, rawLimit));
    const skip = (currentPage - 1) * pageSize;
    // Execute count and find queries in parallel
    const [total, items] = await Promise.all([
        model.count({ where }),
        model.findMany({
            where,
            skip,
            take: pageSize,
            include,
            orderBy,
            select
        })
    ]);
    const totalPages = Math.ceil(total / pageSize);
    return {
        items,
        pagination: {
            page: currentPage,
            limit: pageSize,
            total,
            totalPages
        }
    };
}
/**
 * Extract pagination parameters from request query
 *
 * @example
 * const { page, limit } = extractPaginationParams(req.query);
 */
function extractPaginationParams(query) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(2000, Number(query.limit) || 20));
    return { page, limit };
}
/**
 * Build where clause from query parameters
 * Handles common filter patterns
 *
 * Note: For more advanced query building, see queryBuilder.ts
 *
 * @example
 * const where = buildWhereClause(req.query, {
 *   searchFields: ['fullName', 'mobileNumber'],
 *   exactMatch: ['policeStationId', 'beatId'],
 *   dateRange: 'createdAt'
 * });
 */
function buildWhereClause(query, options = {}) {
    const where = {};
    const { searchFields = [], exactMatch = [], dateRange, booleanFields = [] } = options;
    // Search across multiple fields
    if (query.search && searchFields.length > 0) {
        where.OR = searchFields.map(field => ({
            [field]: { contains: String(query.search), mode: 'insensitive' }
        }));
    }
    // Exact match filters
    exactMatch.forEach(field => {
        if (query[field]) {
            where[field] = String(query[field]);
        }
    });
    // Boolean fields
    booleanFields.forEach(field => {
        if (query[field] !== undefined) {
            where[field] = query[field] === 'true' || query[field] === true;
        }
    });
    // Date range filter
    if (dateRange && (query.startDate || query.endDate)) {
        where[dateRange] = {};
        if (query.startDate) {
            where[dateRange].gte = new Date(String(query.startDate));
        }
        if (query.endDate) {
            where[dateRange].lte = new Date(String(query.endDate));
        }
    }
    return where;
}
//# sourceMappingURL=pagination.js.map