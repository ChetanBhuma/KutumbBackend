import { Request, Response, NextFunction } from 'express';
export declare class OfficerAuthController {
    static sendOTP(req: Request, res: Response, next: NextFunction): Promise<void>;
    static verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=officerAuthController.d.ts.map