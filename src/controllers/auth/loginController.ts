import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { TokenService } from '../../services/tokenService';
import { PasswordService } from '../../services/passwordService';
import { redisService } from '../../services/redisService';
import { AuditService } from '../../services/AuditService';
import { AppError } from '../../middleware/errorHandler';
import { auditLogger } from '../../config/logger';
import { Role } from '../../types/auth';
import { AuthRequest } from '../../middleware/authenticate';

const resolveUserRole = (user: { role?: string }): Role => {
    return (user.role as Role) || Role.CITIZEN;
};

export class LoginController {
    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { identifier, password } = req.body; // identifier can be email or phone

            // Find user
            const user = await prisma.user.findFirst({
                where: {
                    OR: [{ email: identifier }, { phone: identifier }],
                    isActive: true
                },
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    passwordHash: true,
                    isActive: true,
                    role: true
                }
            });

            if (!user) {
                throw new AppError('Invalid credentials', 401);
            }

            // Verify password
            const isValidPassword = await PasswordService.compare(password, user.passwordHash);
            if (!isValidPassword) {
                auditLogger.warn('Failed login attempt', {
                    identifier,
                    ip: req.ip,
                    userAgent: req.get('user-agent')
                });
                throw new AppError('Invalid credentials', 401);
            }

            // Generate tokens
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

            const tokens = TokenService.generateTokenPair({
                userId: user.id,
                email: user.email,
                role: resolvedRole,
                citizenId
            });

            // Store refresh token in Redis (7 days)
            await redisService.storeRefreshToken(user.id, tokens.refreshToken, 7 * 24 * 60 * 60);

            // Update last login
            await prisma.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() }
            });

            // Log successful login
            await AuditService.log(
                user.id,
                'LOGIN',
                'User',
                user.id,
                {
                    message: 'User logged in',
                    role: resolvedRole,
                    category: 'authentication',
                    status: 'success'
                },
                req.ip || '0.0.0.0',
                req.get('user-agent') || 'Unknown'
            );

            // Fetch dynamic permissions
            let dynamicPermissions: string[] = [];
            try {
                const roleDef = await prisma.role.findUnique({
                    where: { code: resolvedRole },
                    select: {
                        permissions: {
                            select: { code: true }
                        }
                    }
                });
                if (roleDef && roleDef.permissions) {
                    dynamicPermissions = roleDef.permissions.map(p => p.code);
                }
            } catch (err) {
                console.error('Failed to fetch permissions during login', err);
            }

            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        phone: user.phone,
                        role: resolvedRole,
                        permissions: dynamicPermissions
                    },
                    tokens
                },
                message: 'Login successful'
            });
        } catch (error) {
            next(error);
        }
    }

    static async logout(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new AppError('Not authenticated', 401);
            }

            // Delete refresh token from Redis
            await redisService.deleteRefreshToken(req.user.id);

            auditLogger.info('User logged out', {
                userId: req.user.id,
                ip: req.ip
            });

            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    static async refreshToken(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                throw new AppError('Refresh token required', 400);
            }

            // Verify refresh token
            const payload = TokenService.verifyRefreshToken(refreshToken);

            // Check if refresh token exists in Redis
            const storedToken = await redisService.getRefreshToken(payload.userId);
            if (storedToken !== refreshToken) {
                throw new AppError('Invalid refresh token', 401);
            }

            // Generate new access token
            const accessToken = TokenService.generateAccessToken({
                userId: payload.userId,
                email: payload.email,
                role: payload.role
            });

            res.json({
                success: true,
                data: { accessToken },
                message: 'Token refreshed successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}
