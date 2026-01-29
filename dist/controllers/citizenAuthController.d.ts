import { Request, Response, NextFunction } from 'express';
export declare class CitizenAuthController {
    /**
     * Check if mobile number is registered
     */
    static checkRegistration(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    /**
     * Request OTP for mobile number
     */
    static requestOTP(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    /**
     * Verify OTP
     */
    static verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    /**
     * Register new citizen
     */
    static register(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    /**
     * Login citizen
     */
    static login(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    /**
     * Forgot password - request OTP
     */
    static forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    /**
     * Reset password with OTP
     */
    static resetPassword(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    /**
     * Refresh access token
     */
    static refreshToken(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    /**
     * Logout citizen
     */
    static logout(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
}
//# sourceMappingURL=citizenAuthController.d.ts.map