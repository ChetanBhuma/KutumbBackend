import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email?: string;
        mobileNumber?: string;
        role: string;
        citizenId?: string | null;
        officerId?: string | null;
        permissions?: string[];
    };
}
export declare const authenticate: (req: AuthRequest, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=authenticate.d.ts.map