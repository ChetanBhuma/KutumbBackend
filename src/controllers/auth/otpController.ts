import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { TokenService } from '../../services/tokenService';
import { OTPService } from '../../services/otpService';
import { redisService } from '../../services/redisService';
import { AppError } from '../../middleware/errorHandler';
import { auditLogger } from '../../config/logger';
import { Role } from '../../types/auth';

const resolveUserRole = (user: { role?: any; legacyRole?: string | null }): Role => {
    if (user.role && typeof user.role === 'object' && 'code' in user.role) {
        return (user.role.code as Role) || Role.CITIZEN;
    }
    return (user.legacyRole as Role) || (user.role as Role) || Role.CITIZEN;
};

export class OTPController {
    static async sendOTP(req: Request, res: Response, next: NextFunction) {
        try {
            const { identifier } = req.body; // phone or email

            // Generate OTP
            const otp = OTPService.generate();

            // Store OTP in Redis (10 minutes)
            await redisService.storeOTP(identifier, otp.code, 10 * 60);

            // TODO: Send OTP via SMS/Email gateway
            // For now, log it (in production, remove this!)
            if (process.env.NODE_ENV !== 'production') {
                console.log(`OTP for ${identifier}: ${otp.code}`);
            }

            auditLogger.info('OTP sent', {
                identifier,
                expiresAt: otp.expiresAt,
                ip: req.ip
            });

            res.json({
                success: true,
                data: {
                    expiresAt: otp.expiresAt,
                    ...(process.env.NODE_ENV === 'development' && { otp: otp.code }) // Only in dev
                },
                message: 'OTP sent successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    static async verifyOTP(req: Request, res: Response, next: NextFunction) {
        try {
            const { identifier, otp } = req.body;
            // Get stored OTP from Redis
            const storedOTP = await redisService.getOTP(identifier);

            if (!storedOTP) {
                throw new AppError('OTP expired or not found', 400);
            }

            // Verify OTP
            if (storedOTP !== otp) {
                auditLogger.warn('Invalid OTP attempt', {
                    identifier,
                    ip: req.ip
                });
                throw new AppError('Invalid OTP', 400);
            }

            // Delete OTP after successful verification
            await redisService.deleteOTP(identifier);

            // Find or create user
            let user = await prisma.user.findFirst({
                where: {
                    OR: [{ email: identifier }, { phone: identifier }]
                },
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    role: true
                }
            });

            if (!user) {
                // Auto-register user with OTP login
                user = await prisma.user.create({
                    data: {
                        email: identifier.includes('@') ? identifier : '',
                        phone: identifier.includes('@') ? '' : identifier,
                        passwordHash: '', // No password for OTP users
                        role: Role.CITIZEN,
                        isActive: true
                    },
                    select: {
                        id: true,
                        email: true,
                        phone: true,
                        role: true
                    }
                });
            }

            const resolvedRole = resolveUserRole(user);

            let citizenId: string | undefined;
            if (resolvedRole === Role.CITIZEN) {
                const citizen = await prisma.seniorCitizen.findUnique({
                    where: { userId: user.id }
                });
                if (citizen) {
                    citizenId = citizen.id;
                }
            }

            // Generate tokens
            const tokens = TokenService.generateTokenPair({
                userId: user.id,
                email: user.email,
                role: resolvedRole,
                citizenId
            });

            // Store refresh token
            await redisService.storeRefreshToken(user.id, tokens.refreshToken, 7 * 24 * 60 * 60);

            // Update last login
            await prisma.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() }
            });

            auditLogger.info('OTP login successful', {
                userId: user.id,
                role: resolvedRole,
                identifier,
                ip: req.ip
            });

            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        phone: user.phone,
                        role: resolvedRole
                    },
                    tokens
                },
                message: 'Login successful'
            });
        } catch (error) {
            next(error);
        }
    }
}
