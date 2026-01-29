import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { TokenService } from '../../services/tokenService';
import { OTPService } from '../../services/otpService';
import { redisService } from '../../services/redisService';
import { AppError } from '../../middleware/errorHandler';
import { auditLogger } from '../../config/logger';
import { Role } from '../../types/auth';

const resolveUserRole = (user: { role?: string }): Role => {
    return (user.role as Role) || Role.OFFICER;
};

export class OfficerAuthController {
    static async sendOTP(req: Request, res: Response, next: NextFunction) {
        try {
            const { badgeNumber } = req.body;

            if (!badgeNumber) {
                throw new AppError('Badge number is required', 400);
            }

            // Find officer by badge number
            const officer = await prisma.beatOfficer.findUnique({
                where: { badgeNumber },
                include: { user: true }
            });

            if (!officer) {
                throw new AppError('Officer not found', 404);
            }

            if (!officer.mobileNumber) {
                throw new AppError('Officer mobile number not registered', 400);
            }

            // Generate OTP
            const otp = OTPService.generate();

            // Store OTP in Redis (10 minutes) - Use badgeNumber as key prefix or mobile
            // Using mobileNumber ensures consistency if we reuse OTP verification logic,
            // but here we want to verify against badgeNumber flow.
            // Let's store against mobileNumber to reuse common OTP verification if needed,
            // or store against badgeNumber. Let's store against badgeNumber for this specific flow.
            await redisService.storeOTP(`officer:${badgeNumber}`, otp.code, 10 * 60);

            // TODO: Send OTP via SMS gateway to officer.mobileNumber
            if (process.env.NODE_ENV !== 'production') {
                console.log(`OTP for Officer ${badgeNumber} (${officer.mobileNumber}): ${otp.code}`);
            }

            auditLogger.info('Officer OTP sent', {
                officerId: officer.id,
                badgeNumber,
                mobileNumber: officer.mobileNumber, // Mask in prod
                ip: req.ip
            });

            res.json({
                success: true,
                data: {
                    expiresAt: otp.expiresAt,
                    message: `OTP sent to mobile ending in ${officer.mobileNumber.slice(-4)}`,
                    ...(process.env.NODE_ENV === 'development' && { otp: otp.code })
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async verifyOTP(req: Request, res: Response, next: NextFunction) {
        try {
            const { badgeNumber, otp } = req.body;

            if (!badgeNumber || !otp) {
                throw new AppError('Badge number and OTP are required', 400);
            }

            const isDevBypass = process.env.NODE_ENV !== 'production' && otp === '000000';

            if (!isDevBypass) {
                const storedOTP = await redisService.getOTP(`officer:${badgeNumber}`);

                if (!storedOTP) {
                    throw new AppError('OTP expired or not found', 400);
                }

                if (storedOTP !== otp) {
                    auditLogger.warn('Invalid Officer OTP attempt', { badgeNumber, ip: req.ip });
                    throw new AppError('Invalid OTP', 400);
                }

                await redisService.deleteOTP(`officer:${badgeNumber}`);
            }

            // Find officer and linked user
            const officer = await prisma.beatOfficer.findUnique({
                where: { badgeNumber },
                include: { user: true }
            });

            if (!officer) {
                throw new AppError('Officer not found', 404);
            }

            let user = officer.user;

            if (!user) {
                // If officer exists but no user account, create one?
                // Or fail? Requirement says "Officers will log in using their unique Official ID".
                // It implies they should be able to log in.
                // Let's create a user if missing, linked to this officer.

                // We need a unique email or phone for the User table.
                // Officer has mobileNumber.

                user = await prisma.user.create({
                    data: {
                        email: officer.email || `officer.${officer.badgeNumber}@delhipolice.gov.in`, // Fallback email
                        phone: officer.mobileNumber,
                        passwordHash: '', // No password
                        role: Role.OFFICER,
                        isActive: true,
                        officerProfile: {
                            connect: { id: officer.id }
                        }
                    }
                });
            }

            const resolvedRole = resolveUserRole(user);

            // Generate tokens
            const tokens = TokenService.generateTokenPair({
                userId: user.id,
                email: user.email,
                role: resolvedRole
            });

            await redisService.storeRefreshToken(user.id, tokens.refreshToken, 7 * 24 * 60 * 60);

            await prisma.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() }
            });

            auditLogger.info('Officer logged in', {
                userId: user.id,
                officerId: officer.id,
                badgeNumber,
                ip: req.ip
            });

            const permissionCodes = await prisma.role.findUnique({
                where: { code: resolvedRole },
                select: {
                    permissions: {
                        select: { code: true }
                    }
                }
            });

            console.log('[AuthDebug] Officer Login:', {
                userRole: user.role,
                resolvedRole: resolvedRole,
                officerBadge: officer.badgeNumber
            });

            console.log('[AuthDebug] Raw Permission Codes from DB:', JSON.stringify(permissionCodes));

            const permissions = permissionCodes?.permissions.map(p => p.code) || [];

            console.log('[AuthDebug] Mapped Permissions:', permissions);

            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        role: resolvedRole,
                        permissions, // Send permissions to frontend
                        officerProfile: {
                            id: officer.id,
                            name: officer.name,
                            badgeNumber: officer.badgeNumber,
                            rank: officer.rank
                        }
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
