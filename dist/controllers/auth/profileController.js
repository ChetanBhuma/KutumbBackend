"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileController = void 0;
const database_1 = require("../../config/database");
const errorHandler_1 = require("../../middleware/errorHandler");
const auth_1 = require("../../types/auth");
const resolveUserRole = (user) => {
    return user.role || auth_1.Role.CITIZEN;
};
class ProfileController {
    static async me(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.AppError('Not authenticated', 401);
            }
            const user = await database_1.prisma.user.findUnique({
                where: { id: req.user.id },
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    role: true,
                    isActive: true,
                    mfaEnabled: true,
                    lastLogin: true,
                    createdAt: true
                }
            });
            if (!user) {
                throw new errorHandler_1.AppError('User not found', 404);
            }
            const resolvedRole = resolveUserRole(user);
            // Fetch dynamic permissions
            let dynamicPermissions = [];
            try {
                const roleDef = await database_1.prisma.role.findUnique({
                    where: { code: resolvedRole },
                    include: {
                        permissions: true
                    }
                });
                if (roleDef && roleDef.permissions) {
                    const perms = roleDef.permissions;
                    if (Array.isArray(perms)) {
                        dynamicPermissions = perms.map((p) => typeof p === 'string' ? p : p.code);
                    }
                }
            }
            catch (err) {
                console.error('Failed to fetch permissions during profile fetch', err);
            }
            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        phone: user.phone,
                        role: resolvedRole,
                        permissions: dynamicPermissions,
                        isActive: user.isActive,
                        mfaEnabled: user.mfaEnabled,
                        lastLogin: user.lastLogin,
                        createdAt: user.createdAt
                    }
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ProfileController = ProfileController;
//# sourceMappingURL=profileController.js.map