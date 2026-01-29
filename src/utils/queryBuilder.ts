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
export function buildWhereClause(
    query: any,
    options: QueryBuilderOptions = {}
): any {
    const where: any = {};
    const {
        searchFields = [],
        exactMatchFields = [],
        dateRangeField,
        booleanFields = [],
        numericRangeFields = []
    } = options;

    // Search across multiple fields (OR condition)
    if (query.search && searchFields.length > 0) {
        where.OR = searchFields.map(field => ({
            [field]: { contains: String(query.search), mode: 'insensitive' }
        }));
    }

    // Exact match filters
    exactMatchFields.forEach(field => {
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
    if (dateRangeField && (query.startDate || query.endDate)) {
        where[dateRangeField] = {};
        if (query.startDate) {
            where[dateRangeField].gte = new Date(String(query.startDate));
        }
        if (query.endDate) {
            where[dateRangeField].lte = new Date(String(query.endDate));
        }
    }

    // Numeric range filters
    numericRangeFields.forEach(field => {
        const minKey = `${field}Min`;
        const maxKey = `${field}Max`;

        if (query[minKey] !== undefined || query[maxKey] !== undefined) {
            where[field] = {};
            if (query[minKey] !== undefined) {
                where[field].gte = Number(query[minKey]);
            }
            if (query[maxKey] !== undefined) {
                where[field].lte = Number(query[maxKey]);
            }
        }
    });

    return where;
}

/**
 * Build order by clause from query parameters
 * 
 * @example
 * const orderBy = buildOrderBy(req.query);
 * // ?sortBy=createdAt&sortOrder=desc
 * // Returns: { createdAt: 'desc' }
 */
export function buildOrderBy(query: any, defaultSort: any = { createdAt: 'desc' }): any {
    if (!query.sortBy) {
        return defaultSort;
    }

    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    return { [query.sortBy]: sortOrder };
}

/**
 * Build include clause for common relations
 * 
 * @example
 * const include = buildInclude(['policeStation', 'beat', 'officer']);
 */
export function buildInclude(relations: string[]): any {
    const include: any = {};

    relations.forEach(relation => {
        // Common relation patterns
        switch (relation) {
            case 'policeStation':
                include.PoliceStation = {
                    select: { id: true, name: true, code: true }
                };
                break;
            case 'beat':
                include.Beat = {
                    select: { id: true, name: true, code: true }
                };
                break;
            case 'officer':
                include.BeatOfficer = {
                    select: { id: true, name: true, rank: true, badgeNumber: true }
                };
                break;
            case 'citizen':
            case 'seniorCitizen':
                include.SeniorCitizen = {
                    select: {
                        id: true,
                        fullName: true,
                        mobileNumber: true,
                        vulnerabilityLevel: true
                    }
                };
                break;
            case 'district':
                include.District = {
                    select: { id: true, name: true, code: true }
                };
                break;
            default:
                // Capitalize first letter for default relation names as a heuristic
                const capitalizedRelation = relation.charAt(0).toUpperCase() + relation.slice(1);
                include[capitalizedRelation] = true;
        }
    });

    return include;
}

/**
 * Sanitize query parameters
 * Removes undefined, null, and empty strings
 */
export function sanitizeQuery(query: any): any {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null && value !== '') {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * Extract filter parameters from query
 * Returns only filter-related params (excludes page, limit, sortBy, etc.)
 */
export function extractFilters(query: any): any {
    const excludeKeys = ['page', 'limit', 'sortBy', 'sortOrder', 'search'];
    const filters: any = {};

    for (const [key, value] of Object.entries(query)) {
        if (!excludeKeys.includes(key) && value !== undefined && value !== null && value !== '') {
            filters[key] = value;
        }
    }

    return filters;
}
