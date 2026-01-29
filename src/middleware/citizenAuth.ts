import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from './errorHandler';
import { AuthRequest } from './authenticate';
import { Role, RolePermissions } from '../types/auth';

export const authenticateCitizen = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('No token provided', 401);
        }

        const token = authHeader.substring(7);

        try {
            const payload = jwt.verify(token, config.jwt.secret) as any;

            console.log('DEBUG: Auth Middleware Payload:', JSON.stringify(payload)); // Added Debug Log

            if (payload.role !== Role.CITIZEN) {
                console.error('DEBUG: Invalid role in token:', payload.role);
                throw new AppError('Invalid token type', 403);
            }

            if (!payload.citizenId) {
                console.warn('DEBUG: No citizenId in token payload');
            }

            req.user = {
                id: payload.userId,
                mobileNumber: payload.email, // email field holds mobile number for citizens
                citizenId: payload.citizenId,
                role: payload.role,
                permissions: RolePermissions[Role.CITIZEN] || []
            };

            // Log authentication (maybe too verbose for every request, but good for now)
            // auditLogger.info('Citizen authenticated', {
            //     userId: payload.id,
            //     citizenId: payload.citizenId,
            //     role: payload.role
            // });

            next();
        } catch (err) {
            console.error('DEBUG: Auth Middleware Verify Error:', err);
            throw new AppError('Invalid or expired token', 401);
        }
    } catch (error) {
        next(error);
    }
};
