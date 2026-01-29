"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyService = void 0;
// API Key management for external integrations
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../config/logger");
class ApiKeyService {
    apiKeys = new Map();
    // Generate a new API key
    generateApiKey(name, permissions, rateLimit = 60) {
        const keyId = `key_${Date.now()}`;
        const key = this.generateKey();
        const apiKey = {
            id: keyId,
            key: `sk_${key}`,
            name,
            permissions,
            rateLimit,
            active: true,
            createdAt: new Date(),
        };
        this.apiKeys.set(apiKey.key, apiKey);
        logger_1.logger.info('API key generated', { keyId, name, permissions });
        return apiKey;
    }
    // Validate API key
    validateApiKey(key) {
        const apiKey = this.apiKeys.get(key);
        if (!apiKey) {
            return null;
        }
        if (!apiKey.active) {
            logger_1.logger.warn('Inactive API key used', { keyId: apiKey.id });
            return null;
        }
        if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
            logger_1.logger.warn('Expired API key used', { keyId: apiKey.id });
            return null;
        }
        // Update last used timestamp
        apiKey.lastUsedAt = new Date();
        return apiKey;
    }
    // Check if API key has permission
    hasPermission(apiKey, permission) {
        return apiKey.permissions.includes(permission) || apiKey.permissions.includes('*');
    }
    // Revoke API key
    revokeApiKey(key) {
        const apiKey = this.apiKeys.get(key);
        if (apiKey) {
            apiKey.active = false;
            logger_1.logger.info('API key revoked', { keyId: apiKey.id });
            return true;
        }
        return false;
    }
    // Generate random key
    generateKey() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    // List all API keys (without showing full key)
    listApiKeys() {
        return Array.from(this.apiKeys.values()).map((key) => ({
            id: key.id,
            name: key.name,
            key: key.key.substring(0, 10) + '...',
            permissions: key.permissions,
            active: key.active,
            createdAt: key.createdAt,
            lastUsedAt: key.lastUsedAt,
        }));
    }
}
exports.apiKeyService = new ApiKeyService();
// Pre-generate some API keys for testing
exports.apiKeyService.generateApiKey('External System 1', ['citizens:read', 'visits:read'], 100);
exports.apiKeyService.generateApiKey('Integration Partner', ['*'], 200);
exports.default = exports.apiKeyService;
//# sourceMappingURL=apiKeyService.js.map