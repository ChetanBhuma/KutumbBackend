import { prisma } from '../config/database';

export class OfficerAssignmentService {
    /**
     * Assigns a beat officer to a senior citizen based on their location (beat).
     * FIX: Now includes workload balancing to distribute assignments evenly.
     */
    static async assignOfficerToCitizen(_citizenId: string, beatId?: string | null, policeStationId?: string): Promise<string | null> {
        if (!beatId && !policeStationId) return null;

        const whereClause: any = { isActive: true };
        if (beatId) {
            whereClause.beatId = beatId;
        } else if (policeStationId) {
            whereClause.policeStationId = policeStationId;
        }

        // Get all active officers in the beat or police station
        const officers = await prisma.beatOfficer.findMany({
            where: whereClause,
            include: {
                // Count active and scheduled visits
                _count: {
                    select: {
                        Visit: {
                            where: {
                                status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
                            }
                        }
                    }
                }
            }
        });

        if (officers.length === 0) {
            return null;
        }

        // WORKLOAD BALANCING: Sort officers by workload (least visits first)
        officers.sort((a, b) => a._count.Visit - b._count.Visit);

        // Assign to officer with least workload
        return officers[0].id;
    }

    /**
     * Determines the correct beat for a citizen based on location.
     * (Placeholder for future geospatial logic)
     */
    static async determineBeat(_latitude: number, _longitude: number): Promise<string | null> {
        // Future: Use PostGIS or custom logic to find beat polygon containing point
        return null;
    }
}
