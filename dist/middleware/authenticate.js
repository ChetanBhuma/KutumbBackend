"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const tokenService_1 = require("../services/tokenService");
const errorHandler_1 = require("./errorHandler");
const logger_1 = require("../config/logger");
const database_1 = require("../config/database");
const authenticate = async (req, _res, next) => {
    try {
        // Get token from Authorization header only
        let token = '';
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
        if (!token) {
            throw new errorHandler_1.AppError('No token provided', 401);
        }
        // Verify token
        const payload = tokenService_1.TokenService.verifyAccessToken(token);
        // Debug Log
        // console.log(`[Auth] User: ${payload.userId}, Role: ${payload.role}, PayloadCitizenId: ${payload.citizenId}`);
        // Attach user to request
        let latestCitizenId = payload.citizenId || payload.citizenId;
        let latestOfficerId = payload.officerId;
        // If it's a citizen role, double check the DB to handle stale tokens
        // Check for both 'CITIZEN' and lowercase 'citizen' to be safe
        if (payload.role === 'CITIZEN' || payload.role.toUpperCase() === 'CITIZEN') {
            try {
                const userId = payload.userId || payload.id;
                if (userId) {
                    const authRecord = await database_1.prisma.citizenAuth.findUnique({
                        where: { id: userId },
                        select: { citizenId: true }
                    });
                    if (authRecord) {
                        // console.log(`[Auth] DB Lookup Result: ${authRecord.citizenId}`);
                        if (authRecord.citizenId) {
                            latestCitizenId = authRecord.citizenId;
                        }
                    }
                    else {
                        // console.log(`[Auth] No CitizenAuth found for ID: ${userId}`);
                    }
                }
            }
            catch (dbError) {
                console.error('[Auth] DB Lookup Failed:', dbError);
                // Continue with token payload as fallback
            }
        }
        // Check User table for up-to-date role (Fix for stale tokens)
        try {
            const userId = payload.userId || payload.id;
            if (userId) {
                const user = await database_1.prisma.user.findUnique({
                    where: { id: userId },
                    select: { role: true, officerId: true }
                });
                if (user) {
                    payload.role = user.role;
                    latestOfficerId = user.officerId;
                }
            }
        }
        catch (dbErr) {
            console.error('[Auth] User Role Sync Failed', dbErr);
        }
        // Fetch permissions for the role
        let dynamicPermissions = [];
        try {
            if (payload.role) {
                // Check if the role exists in the DB to get dynamic permissions
                const roleDef = await database_1.prisma.role.findUnique({
                    where: { code: payload.role },
                    select: { permissions: true }
                });
                if (roleDef && roleDef.permissions) {
                    // Extract permission codes from the relationship
                    dynamicPermissions = roleDef.permissions.map((p) => p.code);
                }
            }
        }
        catch (permErr) {
            console.error('[Auth] Permission Sync Failed', permErr);
        }
        req.user = {
            id: payload.userId || payload.id,
            email: payload.email,
            role: payload.role,
            citizenId: latestCitizenId,
            officerId: latestOfficerId,
            mobileNumber: payload.mobileNumber,
            permissions: dynamicPermissions
        };
        // Log authentication
        logger_1.auditLogger.info('User authenticated', {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            path: req.path,
            method: req.method
        });
        next();
    }
    catch (error) {
        next(new errorHandler_1.AppError('Invalid or expired token', 401));
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=authenticate.js.map