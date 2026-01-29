/**
 * Query Builder Utilities
 * Eliminates repeated query building patterns across controllers
 */
export interface QueryBuilderOptions {
    searchFields?: string[];
    exactMatchFields?: string[];
    dateRangeField?: string;
    booleanFields?: string[];
    numericRangeFields?: string[];
}
/**
 * Build Prisma where clause from query parameters
 * Handles common filter patterns
 *
 * @example
 * const where = buildWhereClause(req.query, {
 *   searchFields: ['fullName', 'mobileNumber'],
 *   exactMatchFields: ['policeStationId', 'beatId'],
 *   dateRangeField: 'createdAt',
 *   booleanFields: ['isActive']
 * });
 */
export declare function buildWhereClause(query: any, options?: QueryBuilderOptions): any;
/**
 * Build order by clause from query parameters
 *
 * @example
 * const orderBy = buildOrderBy(req.query);
 * // ?sortBy=createdAt&sortOrder=desc
 * // Returns: { createdAt: 'desc' }
 */
export declare function buildOrderBy(query: any, defaultSort?: any): any;
/**
 * Build include clause for common relations
 *
 * @example
 * const include = buildInclude(['policeStation', 'beat', 'officer']);
 */
export declare function buildInclude(relations: string[]): any;
/**
 * Sanitize query parameters
 * Removes undefined, null, and empty strings
 */
export declare function sanitizeQuery(query: any): any;
/**
 * Extract filter parameters from query
 * Returns only filter-related params (excludes page, limit, sortBy, etc.)
 */
export declare function extractFilters(query: any): any;
//# sourceMappingURL=queryBuilder.d.ts.map