import { Request, Response, NextFunction } from 'express';
export declare class OTPController {
    static sendOTP(req: Request, res: Response, next: NextFunction): Promise<void>;
    static verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=otpController.d.ts.map