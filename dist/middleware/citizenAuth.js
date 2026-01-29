"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateCitizen = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const errorHandler_1 = require("./errorHandler");
const auth_1 = require("../types/auth");
const authenticateCitizen = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errorHandler_1.AppError('No token provided', 401);
        }
        const token = authHeader.substring(7);
        try {
            const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
            console.log('DEBUG: Auth Middleware Payload:', JSON.stringify(payload)); // Added Debug Log
            if (payload.role !== auth_1.Role.CITIZEN) {
                console.error('DEBUG: Invalid role in token:', payload.role);
                throw new errorHandler_1.AppError('Invalid token type', 403);
            }
            if (!payload.citizenId) {
                console.warn('DEBUG: No citizenId in token payload');
            }
            req.user = {
                id: payload.userId,
                mobileNumber: payload.email, // email field holds mobile number for citizens
                citizenId: payload.citizenId,
                role: payload.role,
                permissions: auth_1.RolePermissions[auth_1.Role.CITIZEN] || []
            };
            // Log authentication (maybe too verbose for every request, but good for now)
            // auditLogger.info('Citizen authenticated', {
            //     userId: payload.id,
            //     citizenId: payload.citizenId,
            //     role: payload.role
            // });
            next();
        }
        catch (err) {
            console.error('DEBUG: Auth Middleware Verify Error:', err);
            throw new errorHandler_1.AppError('Invalid or expired token', 401);
        }
    }
    catch (error) {
        next(error);
    }
};
exports.authenticateCitizen = authenticateCitizen;
//# sourceMappingURL=citizenAuth.js.map