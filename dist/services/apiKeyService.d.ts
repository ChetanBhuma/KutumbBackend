export interface ApiKey {
    id: string;
    key: string;
    name: string;
    permissions: string[];
    rateLimit: number;
    active: boolean;
    createdAt: Date;
    expiresAt?: Date;
    lastUsedAt?: Date;
}
declare class ApiKeyService {
    private apiKeys;
    generateApiKey(name: string, permissions: string[], rateLimit?: number): ApiKey;
    validateApiKey(key: string): ApiKey | null;
    hasPermission(apiKey: ApiKey, permission: string): boolean;
    revokeApiKey(key: string): boolean;
    private generateKey;
    listApiKeys(): Partial<ApiKey>[];
}
export declare const apiKeyService: ApiKeyService;
export default apiKeyService;
//# sourceMappingURL=apiKeyService.d.ts.map