import { Request, Response, NextFunction } from 'express';
import * as citizenAuthService from '../services/citizenAuthService';
import { auditLogger } from '../config/logger';

const formatMobile = (mobile: string) => {
    // Remove all non-digits
    const digits = mobile.replace(/\D/g, '');
    // If 10 digits, add +91
    if (digits.length === 10) return `+91${digits}`;
    // If 12 digits (91...), add +
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    // Return original if unknown (let validation handle it)
    return mobile;
};

export class CitizenAuthController {
    /**
     * Check if mobile number is registered
     */
    static async checkRegistration(req: Request, res: Response, next: NextFunction) {
        try {
            const mobileNumber = formatMobile(req.body.mobileNumber);

            const result = await citizenAuthService.checkRegistration(mobileNumber);

            return res.status(200).json({
                success: true,
                data: {
                    isRegistered: result.isRegistered
                }
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Request OTP for mobile number
     */
    static async requestOTP(req: Request, res: Response, next: NextFunction) {
        try {
            const mobileNumber = formatMobile(req.body.mobileNumber);

            const result = await citizenAuthService.requestOTP(mobileNumber, true);

            auditLogger.info('OTP requested', {
                mobileNumber,
                success: result.success
            });

            const responseData = {
                success: result.success,
                message: result.message,
                data: result.expiresAt ? {
                    expiresAt: result.expiresAt
                    // OTP removed from response for security
                    // OTP should only be delivered via SMS
                } : undefined
            };
            console.log('DEBUG: Sending response:', JSON.stringify(responseData, null, 2));
            return res.status(result.success ? 200 : 400).json(responseData);
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Verify OTP
     */
    static async verifyOTP(req: Request, res: Response, next: NextFunction) {
        try {
            const { otp } = req.body;
            const mobileNumber = formatMobile(req.body.mobileNumber);

            const result = await citizenAuthService.verifyOTP(mobileNumber, otp);

            auditLogger.info('OTP verification attempted', {
                mobileNumber,
                success: result.success
            });

            if (result.success) {
                return res.status(200).json({
                    success: true,
                    message: result.message,
                    data: {
                        tokens: {
                            accessToken: result.accessToken,
                            refreshToken: result.refreshToken
                        },
                        citizen: result.citizen
                    }
                });
            }

            return res.status(400).json({
                success: false,
                message: result.message
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Register new citizen
     */
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { password } = req.body;
            const mobileNumber = formatMobile(req.body.mobileNumber);

            const result = await citizenAuthService.registerCitizen(mobileNumber, password);

            auditLogger.info('Citizen registration attempted', {
                mobileNumber,
                success: result.success
            });

            return res.status(result.success ? 201 : 400).json({
                success: result.success,
                message: result.message
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Login citizen
     */
    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { password } = req.body;
            const mobileNumber = formatMobile(req.body.mobileNumber);
            const ipAddress = req.ip || req.socket.remoteAddress;

            const result = await citizenAuthService.loginCitizen(mobileNumber, password, ipAddress);

            auditLogger.info('Citizen login attempted', {
                mobileNumber,
                success: result.success,
                ipAddress
            });

            if (result.success) {
                return res.json({
                    success: true,
                    message: result.message,
                    data: {
                        tokens: {
                            accessToken: result.accessToken,
                            refreshToken: result.refreshToken
                        },
                        citizen: result.citizen
                    }
                });
            }

            return res.status(401).json({
                success: false,
                message: result.message
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Forgot password - request OTP
     */
    static async forgotPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const mobileNumber = formatMobile(req.body.mobileNumber);

            const result = await citizenAuthService.forgotPassword(mobileNumber);

            auditLogger.info('Password reset requested', {
                mobileNumber,
                success: result.success
            });

            return res.status(result.success ? 200 : 400).json({
                success: result.success,
                message: result.message,
                data: result.expiresAt ? { expiresAt: result.expiresAt } : undefined
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Reset password with OTP
     */
    static async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { otp, newPassword } = req.body;
            const mobileNumber = formatMobile(req.body.mobileNumber);

            const result = await citizenAuthService.resetPassword(mobileNumber, otp, newPassword);

            auditLogger.info('Password reset attempted', {
                mobileNumber,
                success: result.success
            });

            return res.status(result.success ? 200 : 400).json({
                success: result.success,
                message: result.message
            });
        } catch (error) {
            return next(error);
        }
    }


    /**
     * Refresh access token
     */
    static async refreshToken(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token required'
                });
            }

            // Verify refresh token
            const payload = await citizenAuthService.verifyRefreshToken(refreshToken);

            if (!payload.success) {
                return res.status(401).json({
                    success: false,
                    message: payload.message || 'Invalid refresh token'
                });
            }

            auditLogger.info('Token refreshed', {
                userId: payload.userId
            });

            return res.json({
                success: true,
                data: {
                    accessToken: payload.accessToken,
                    refreshToken: payload.refreshToken
                }
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Logout citizen
     */
    static async logout(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;

            if (user && user.mobileNumber) {
                await citizenAuthService.logout(user.mobileNumber);
                auditLogger.info(`Citizen logged out: ${user.mobileNumber}`);
            } else {
                auditLogger.info('Citizen logout attempt without user context');
            }

            return res.json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            return next(error);
        }
    }
}
