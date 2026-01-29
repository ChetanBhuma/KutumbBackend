"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.authenticateApiKey = void 0;
const apiKeyService_1 = __importDefault(require("../services/apiKeyService"));
// Middleware to authenticate API key
const authenticateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            message: 'API key required. Provide X-API-Key header.'
        });
    }
    const validKey = apiKeyService_1.default.validateApiKey(apiKey);
    if (!validKey) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired API key'
        });
    }
    // Attach API key to request
    req.apiKey = validKey;
    next();
};
exports.authenticateApiKey = authenticateApiKey;
// Middleware to check API key permissions
const requirePermission = (permission) => {
    return (req, res, next) => {
        const apiKey = req.apiKey;
        if (!apiKey) {
            return res.status(401).json({
                success: false,
                message: 'API key not authenticated'
            });
        }
        if (!apiKeyService_1.default.hasPermission(apiKey, permission)) {
            return res.status(403).json({
                success: false,
                message: `Permission denied. Required: ${permission}`
            });
        }
        next();
    };
};
exports.requirePermission = requirePermission;
//# sourceMappingURL=apiKeyAuth.js.map