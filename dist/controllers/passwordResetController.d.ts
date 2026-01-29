import { Request, Response, NextFunction } from 'express';
export declare class PasswordResetController {
    /**
     * Request password reset - send reset token to email
     */
    static requestReset(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    /**
     * Reset password using token
     */
    static resetPassword(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=passwordResetController.d.ts.map