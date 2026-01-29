// Database Query Optimization Service
import prisma from '../config/prisma';

/**
 * Optimized query service with best practices for Prisma
 */
class QueryOptimizationService {
    /**
     * Get citizens with optimized includes (avoid N+1 queries)
     */
    async getOptimizedCitizens(filters: any = {}) {
        const { page = 1, limit = 20, includeVisits = false } = filters;
        const skip = (page - 1) * limit;

        // Use select to fetch only needed fields
        const select: any = {
            id: true,
            fullName: true,
            age: true,
            gender: true,
            mobileNumber: true,
            permanentAddress: true,
            vulnerabilityLevel: true,
            verificationStatus: true,
            digitalIdCardNumber: true,
            beat: {
                select: {
                    id: true,
                    beatNumber: true,
                    policeStation: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
        };

        // Conditionally include visits to avoid unnecessary data
        if (includeVisits) {
            select.Visit = {
                take: 5, // Limit related records
                orderBy: { scheduledDate: 'desc' },
                select: {
                    id: true,
                    scheduledDate: true,
                    status: true,
                    visitType: true,
                },
            };
        }

        const [citizens, total] = await Promise.all([
            prisma.seniorCitizen.findMany({
                where: filters.where || {},
                select,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.seniorCitizen.count({
                where: filters.where || {},
            }),
        ]);

        return {
            data: citizens,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Batch fetch related data to avoid N+1 queries
     */
    async getCitizensWithStats(citizenIds: string[]) {
        // Single query with aggregation instead of multiple queries
        const citizensWithStats = await prisma.seniorCitizen.findMany({
            where: {
                id: { in: citizenIds },
            },
            select: {
                id: true,
                fullName: true,
                _count: {
                    select: {
                        Visit: true,
                        SOSAlert: true,
                        FamilyMember: true,
                    },
                },
            },
        });

        return citizensWithStats;
    }

    /**
     * Use cursor-based pagination for large datasets
     */
    async getCitizensCursorPagination(cursor?: string, limit = 20) {
        const citizens = await prisma.seniorCitizen.findMany({
            take: limit + 1, // Fetch one extra to check if there's more
            ...(cursor && {
                skip: 1, // Skip the cursor
                cursor: {
                    id: cursor,
                },
            }),
            orderBy: {
                id: 'asc',
            },
            select: {
                id: true,
                fullName: true,
                age: true,
                mobileNumber: true,
            },
        });

        const hasNextPage = citizens.length > limit;
        const data = hasNextPage ? citizens.slice(0, -1) : citizens;
        const nextCursor = hasNextPage ? data[data.length - 1].id : null;

        return {
            data,
            nextCursor,
            hasNextPage,
        };
    }

    /**
     * Efficient aggregation queries
     */
    async getDashboardStats() {
        // Use raw queries for complex aggregations
        const [citizenStats, visitStats, sosStats] = await Promise.all([
            prisma.seniorCitizen.groupBy({
                by: ['vulnerabilityLevel'],
                _count: true,
            }),
            prisma.visit.groupBy({
                by: ['status'],
                _count: true,
            }),
            prisma.sOSAlert.groupBy({
                by: ['status'],
                _count: true,
            }),
        ]);

        return {
            citizens: citizenStats,
            visits: visitStats,
            sos: sosStats,
        };
    }

    /**
     * Use transactions for consistency
     */
    async createCitizenWithRelations(citizenData: any, familyData: any[]) {
        return await prisma.$transaction(async (tx) => {
            // Create citizen
            const citizen = await tx.seniorCitizen.create({
                data: citizenData,
            });

            // Create family members in batch
            if (familyData.length > 0) {
                await tx.familyMember.createMany({
                    data: familyData.map((fm) => ({
                        ...fm,
                        seniorCitizenId: citizen.id,
                    })),
                });
            }

            return citizen;
        });
    }

    /**
     * Batch operations for bulk updates
     */
    async bulkUpdateCitizens(updates: Array<{ id: string; data: any }>) {
        // Use updateMany when possible or batch individual updates
        const updatePromises = updates.map(({ id, data }) =>
            prisma.seniorCitizen.update({
                where: { id },
                data,
            })
        );

        return await Promise.all(updatePromises);
    }

    /**
     * Use raw queries for complex operations
     */
    async getTopOfficersByPerformance(limit = 10) {
        const result = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.fullName,
        COUNT(DISTINCT v.id) as totalVisits,
        COUNT(DISTINCT CASE WHEN v.status = 'COMPLETED' THEN v.id END) as completedVisits,
        AVG(CASE WHEN v.status = 'COMPLETED' THEN v.duration END) as avgDuration
      FROM User u
      LEFT JOIN Visit v ON v.assignedOfficerId = u.id
      WHERE u.role = 'OFFICER'
      GROUP BY u.id, u.fullName
      ORDER BY completedVisits DESC
      LIMIT ${limit}
    `;

        return result;
    }
}

export default new QueryOptimizationService();
