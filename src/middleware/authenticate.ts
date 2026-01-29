import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/tokenService';
import { AppError } from './errorHandler';
import { auditLogger } from '../config/logger';

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

import { prisma } from '../config/database';

export const authenticate = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
) => {
    try {
        // Get token from Authorization header only
        let token = '';
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }

        if (!token) {
            throw new AppError('No token provided', 401);
        }

        // Verify token
        const payload = TokenService.verifyAccessToken(token);

        // Debug Log
        // console.log(`[Auth] User: ${payload.userId}, Role: ${payload.role}, PayloadCitizenId: ${payload.citizenId}`);

        // Attach user to request
        let latestCitizenId = payload.citizenId || (payload as any).citizenId;
        let latestOfficerId = (payload as any).officerId;

        // If it's a citizen role, double check the DB to handle stale tokens
        // Check for both 'CITIZEN' and lowercase 'citizen' to be safe
        if (payload.role === 'CITIZEN' || (payload.role as string).toUpperCase() === 'CITIZEN') {
            try {
                const userId = payload.userId || (payload as any).id;
                if (userId) {
                    const authRecord = await prisma.citizenAuth.findUnique({
                        where: { id: userId },
                        select: { citizenId: true }
                    });

                    if (authRecord) {
                        // console.log(`[Auth] DB Lookup Result: ${authRecord.citizenId}`);
                        if (authRecord.citizenId) {
                            latestCitizenId = authRecord.citizenId;
                        }
                    } else {
                        // console.log(`[Auth] No CitizenAuth found for ID: ${userId}`);
                    }
                }
            } catch (dbError) {
                console.error('[Auth] DB Lookup Failed:', dbError);
                // Continue with token payload as fallback
            }
        }

        // Check User table for up-to-date role (Fix for stale tokens)
        try {
            const userId = payload.userId || (payload as any).id;
            if (userId) {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { role: true, officerId: true }
                });

                if (user) {
                    payload.role = user.role as any;
                    latestOfficerId = user.officerId;
                }
            }
        } catch (dbErr) {
            console.error('[Auth] User Role Sync Failed', dbErr);
        }

        // Fetch permissions for the role
        let dynamicPermissions: string[] = [];
        try {
            if (payload.role) {
                // Check if the role exists in the DB to get dynamic permissions
                const roleDef = await prisma.role.findUnique({
                    where: { code: payload.role as string },
                    select: { permissions: true }
                });

                if (roleDef && roleDef.permissions) {
                    // Extract permission codes from the relationship
                    dynamicPermissions = roleDef.permissions.map((p: any) => p.code);
                }
            }
        } catch (permErr) {
            console.error('[Auth] Permission Sync Failed', permErr);
        }

        req.user = {
            id: payload.userId || (payload as any).id,
            email: payload.email,
            role: payload.role,
            citizenId: latestCitizenId,
            officerId: latestOfficerId,
            mobileNumber: (payload as any).mobileNumber,
            permissions: dynamicPermissions
        };

        // Log authentication
        auditLogger.info('User authenticated', {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            path: req.path,
            method: req.method
        });

        next();
    } catch (error) {
        next(new AppError('Invalid or expired token', 401));
    }
};
