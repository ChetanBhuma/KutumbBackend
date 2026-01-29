import { Request, Response } from 'express';
import { prisma } from '../config/database'; // Adjust path if needed

/**
 * Get full organizational hierarchy tree
 * Structure: Range -> District -> Station -> Beat
 * (SubDivision and Post are skipped as they don't exist in DB)
 */
export const getHierarchyTree = async (_req: Request, res: Response) => {
    try {
        // Fetch all active districts with nested stations and beats
        const districts = await prisma.district.findMany({
            where: { isActive: true },
            include: {
                PoliceStation: {
                    where: { isActive: true },
                    include: {
                        Beat: {
                            where: { isActive: true }
                        }
                    },
                    orderBy: { name: 'asc' }
                }
            },
            orderBy: { name: 'asc' }
        });

        // Group by Range
        const hierarchyTree: any[] = [];
        const rangeMap = new Map<string, any>();

        for (const district of districts) {
            const rangeName = district.range || 'Unknown'; // Handle null range
            const rangeCode = rangeName.toUpperCase().substring(0, 3); // Simple code gen
            const rangeId = `range-${rangeName.replace(/\s+/g, '-').toLowerCase()}`;

            // Create Range Node if it doesn't exist
            if (!rangeMap.has(rangeName)) {
                const rangeNode = {
                    id: rangeId,
                    name: rangeName,
                    code: rangeCode,
                    type: 'range',
                    children: [],
                    data: { name: rangeName, code: rangeCode } // Metadata
                };
                rangeMap.set(rangeName, rangeNode);
                hierarchyTree.push(rangeNode);
            }

            const currentRange = rangeMap.get(rangeName);

            // Construct District Node
            const districtNode = {
                id: district.id,
                name: district.name,
                code: district.code,
                type: 'district',
                parentId: rangeId,
                children: [] as any[],
                data: district
            };

            // Process Stations
            if (district.PoliceStation) {
                for (const station of district.PoliceStation) {
                    const stationNode = {
                        id: station.id,
                        name: station.name,
                        code: station.code,
                        type: 'station',
                        parentId: district.id,
                        children: [] as any[],
                        data: station
                    };

                    // Process Beats
                    if (station.Beat) {
                        for (const beat of station.Beat) {
                            const beatNode = {
                                id: beat.id,
                                name: beat.name,
                                code: beat.code,
                                type: 'beat',
                                parentId: station.id,
                                children: [],
                                data: beat
                            };
                            stationNode.children.push(beatNode);
                        }
                    }
                    districtNode.children.push(stationNode);
                }
            }

            currentRange.children.push(districtNode);
        }

        return res.json({
            success: true,
            data: hierarchyTree
        });

    } catch (error) {
        console.error('Get hierarchy tree error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching hierarchy tree'
        });
    }
};
