"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterController = void 0;
const database_1 = require("../../config/database");
const passwordService_1 = require("../../services/passwordService");
const errorHandler_1 = require("../../middleware/errorHandler");
const logger_1 = require("../../config/logger");
const auth_1 = require("../../types/auth");
const resolveUserRole = (user) => {
    return user.role || auth_1.Role.CITIZEN;
};
class RegisterController {
    static async register(req, res, next) {
        try {
            const { email, phone, password, role = auth_1.Role.CITIZEN } = req.body;
            // Validate password strength
            const passwordValidation = passwordService_1.PasswordService.validateStrength(password);
            if (!passwordValidation.valid) {
                throw new errorHandler_1.AppError(passwordValidation.errors.join(', '), 400);
            }
            // Check if user already exists
            const existingUser = await database_1.prisma.user.findFirst({
                where: {
                    OR: [{ email }, { phone }]
                }
            });
            if (existingUser) {
                throw new errorHandler_1.AppError('User with this email or phone already exists', 409);
            }
            // Hash password
            const passwordHash = await passwordService_1.PasswordService.hash(password);
            // Create user
            const user = await database_1.prisma.user.create({
                data: {
                    email,
                    phone,
                    passwordHash,
                    role,
                    isActive: true
                },
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    role: true,
                    createdAt: true
                }
            });
            // Log registration
            const resolvedRole = resolveUserRole(user);
            const formattedUser = {
                id: user.id,
                email: user.email,
                phone: user.phone,
                role: resolvedRole,
                createdAt: user.createdAt
            };
            logger_1.auditLogger.info('User registered', {
                userId: user.id,
                email: user.email,
                role: resolvedRole,
                ip: req.ip
            });
            res.status(201).json({
                success: true,
                data: { user: formattedUser },
                message: 'User registered successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.RegisterController = RegisterController;
//# sourceMappingURL=registerController.js.map