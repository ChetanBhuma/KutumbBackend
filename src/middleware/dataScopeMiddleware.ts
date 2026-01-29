import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from './authenticate';
import { AppError } from './errorHandler';

export interface DataScope {
    level: 'ALL' | 'RANGE' | 'DISTRICT' | 'SUBDIVISION' | 'POLICE_STATION' | 'BEAT';
    jurisdictionIds: {
        rangeId?: string;
        districtId?: string;
        subDivisionId?: string;
        policeStationId?: string;
        beatId?: string;
    };
}

declare global {
    namespace Express {
        interface Request {
            dataScope?: DataScope;
        }
    }
}

export const dataScopeMiddleware = async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.role) {
            return next();
        }

        const userRole = req.user.role;
        const officerId = req.user.officerId;

        // Fetch role configuration from database (dynamic!)
        const roleConfig = await prisma.role.findUnique({
            where: { code: userRole },
            select: { jurisdictionLevel: true }
        });

        // If role not found or no jurisdiction level defined, default to no access
        if (!roleConfig || !roleConfig.jurisdictionLevel) {
            req.dataScope = { level: 'BEAT', jurisdictionIds: {} };
            return next();
        }

        const jurisdictionLevel = roleConfig.jurisdictionLevel;

        // 1. ALL ACCESS (for roles like SUPER_ADMIN, COMMISSIONER, ADMIN)
        if (jurisdictionLevel === 'ALL' || jurisdictionLevel === 'STATE') {
            req.dataScope = { level: 'ALL', jurisdictionIds: {} };
            return next();
        }

        // 2. Citizens shouldn't access these endpoints
        if (userRole === 'CITIZEN' || jurisdictionLevel === 'NONE') {
            req.dataScope = { level: 'BEAT', jurisdictionIds: {} }; // Effectively none
            return next();
        }

        // 3. Officer Roles - Fetch Profile
        if (!officerId) {
            // Role requires officer profile but none exists
            req.dataScope = { level: 'BEAT', jurisdictionIds: {} };
            return next();
        }

        const officer = await prisma.beatOfficer.findUnique({
            where: { id: officerId },
            select: {
                id: true,
                rangeId: true,
                districtId: true,
                subDivisionId: true,
                policeStationId: true,
                beatId: true,
                rank: true
            }
        });

        if (!officer) {
            return next(new AppError('Officer profile not found', 403));
        }

        // 4. Apply jurisdiction based on role's jurisdictionLevel (DYNAMIC!)
        let scope: DataScope;

        switch (jurisdictionLevel) {
            case 'RANGE':
                scope = {
                    level: 'RANGE',
                    jurisdictionIds: { rangeId: officer.rangeId || undefined }
                };
                break;

            case 'DISTRICT':
                scope = {
                    level: 'DISTRICT',
                    jurisdictionIds: { districtId: officer.districtId || undefined }
                };
                break;

            case 'SUBDIVISION':
            case 'SUB_DIVISION':
                scope = {
                    level: 'SUBDIVISION',
                    jurisdictionIds: { subDivisionId: officer.subDivisionId || undefined }
                };
                break;

            case 'POLICE_STATION':
                scope = {
                    level: 'POLICE_STATION',
                    jurisdictionIds: { policeStationId: officer.policeStationId || undefined }
                };
                break;

            case 'BEAT':
                if (officer.beatId) {
                    scope = {
                        level: 'BEAT',
                        jurisdictionIds: { beatId: officer.beatId }
                    };
                } else {
                    // If a beat-level officer has no beat assigned, they see nothing
                    scope = {
                        level: 'BEAT',
                        jurisdictionIds: { beatId: 'UNASSIGNED' }
                    };
                }
                break;

            default:
                // Unknown jurisdiction level - default to minimal access
                scope = {
                    level: 'BEAT',
                    jurisdictionIds: {}
                };
        }

        req.dataScope = scope;
        next();
    } catch (error) {
        next(error);
    }
};
