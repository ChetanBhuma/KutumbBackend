export interface PaginationOptions {
    page?: number;
    limit?: number;
    where?: any;
    include?: any;
    orderBy?: any;
    select?: any;
}
export interface PaginationResult<T> {
    items: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
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
export declare function paginatedQuery<T>(model: any, options?: PaginationOptions): Promise<PaginationResult<T>>;
/**
 * Extract pagination parameters from request query
 *
 * @example
 * const { page, limit } = extractPaginationParams(req.query);
 */
export declare function extractPaginationParams(query: any): {
    page: number;
    limit: number;
};
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
export declare function buildWhereClause(query: any, options?: {
    searchFields?: string[];
    exactMatch?: string[];
    dateRange?: string;
    booleanFields?: string[];
}): any;
//# sourceMappingURL=pagination.d.ts.map