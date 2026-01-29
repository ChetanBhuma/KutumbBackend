"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
class SettingsController {
    /**
     * Get all system settings
     */
    static async getSettings(_req, res, next) {
        try {
            const settings = await database_1.prisma.systemSetting.findMany({
                orderBy: { key: 'asc' }
            });
            // Convert array to object for easier frontend consumption
            const settingsMap = settings.reduce((acc, curr) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {});
            res.json({
                success: true,
                data: {
                    list: settings,
                    map: settingsMap
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update a specific setting
     */
    static async updateSetting(req, res, next) {
        try {
            const { key } = req.params;
            const { value, description } = req.body;
            if (value === undefined) {
                throw new errorHandler_1.AppError('Value is required', 400);
            }
            const setting = await database_1.prisma.systemSetting.upsert({
                where: { key },
                update: {
                    value: String(value),
                    description,
                    updatedBy: req.user?.email
                },
                create: {
                    key,
                    value: String(value),
                    description,
                    updatedBy: req.user?.email
                }
            });
            res.json({
                success: true,
                data: setting,
                message: 'Setting updated successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SettingsController = SettingsController;
//# sourceMappingURL=settingsController.js.map