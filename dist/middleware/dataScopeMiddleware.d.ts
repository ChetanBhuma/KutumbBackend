import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';
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
export declare const dataScopeMiddleware: (req: AuthRequest, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=dataScopeMiddleware.d.ts.map