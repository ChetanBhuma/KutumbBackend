// API Key management for external integrations
import crypto from 'crypto';
import { logger } from '../config/logger';

export interface ApiKey {
    id: string;
    key: string;
    name: string;
    permissions: string[];
    rateLimit: number; // requests per minute
    active: boolean;
    createdAt: Date;
    expiresAt?: Date;
    lastUsedAt?: Date;
}

class ApiKeyService {
    private apiKeys: Map<string, ApiKey> = new Map();

    // Generate a new API key
    generateApiKey(name: string, permissions: string[], rateLimit: number = 60): ApiKey {
        const keyId = `key_${Date.now()}`;
        const key = this.generateKey();

        const apiKey: ApiKey = {
            id: keyId,
            key: `sk_${key}`,
            name,
            permissions,
            rateLimit,
            active: true,
            createdAt: new Date(),
        };

        this.apiKeys.set(apiKey.key, apiKey);
        logger.info('API key generated', { keyId, name, permissions });

        return apiKey;
    }

    // Validate API key
    validateApiKey(key: string): ApiKey | null {
        const apiKey = this.apiKeys.get(key);

        if (!apiKey) {
            return null;
        }

        if (!apiKey.active) {
            logger.warn('Inactive API key used', { keyId: apiKey.id });
            return null;
        }

        if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
            logger.warn('Expired API key used', { keyId: apiKey.id });
            return null;
        }

        // Update last used timestamp
        apiKey.lastUsedAt = new Date();

        return apiKey;
    }

    // Check if API key has permission
    hasPermission(apiKey: ApiKey, permission: string): boolean {
        return apiKey.permissions.includes(permission) || apiKey.permissions.includes('*');
    }

    // Revoke API key
    revokeApiKey(key: string): boolean {
        const apiKey = this.apiKeys.get(key);
        if (apiKey) {
            apiKey.active = false;
            logger.info('API key revoked', { keyId: apiKey.id });
            return true;
        }
        return false;
    }

    // Generate random key
    private generateKey(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    // List all API keys (without showing full key)
    listApiKeys(): Partial<ApiKey>[] {
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

export const apiKeyService = new ApiKeyService();

// Pre-generate some API keys for testing
apiKeyService.generateApiKey('External System 1', ['citizens:read', 'visits:read'], 100);
apiKeyService.generateApiKey('Integration Partner', ['*'], 200);

export default apiKeyService;
