declare class RedisService {
    private get isConnected();
    constructor();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    /**
     * Set a key-value pair with optional expiration
     */
    set(key: string, value: string, expirySeconds?: number): Promise<void>;
    /**
     * Get value by key
     */
    get(key: string): Promise<string | null>;
    /**
     * Delete a key
     */
    delete(key: string): Promise<void>;
    /**
     * Check if key exists
     */
    exists(key: string): Promise<boolean>;
    /**
     * Set expiration on a key
     */
    expire(key: string, seconds: number): Promise<void>;
    /**
     * Get time to live for a key
     */
    ttl(key: string): Promise<number>;
    /**
     * Store refresh token
     */
    storeRefreshToken(userId: string, refreshToken: string, expirySeconds: number): Promise<void>;
    /**
     * Get refresh token
     */
    getRefreshToken(userId: string): Promise<string | null>;
    /**
     * Delete refresh token (logout)
     */
    deleteRefreshToken(userId: string): Promise<void>;
    /**
     * Store OTP
     */
    storeOTP(identifier: string, otp: string, expirySeconds: number): Promise<void>;
    /**
     * Get OTP
     */
    getOTP(identifier: string): Promise<string | null>;
    /**
     * Delete OTP
     */
    deleteOTP(identifier: string): Promise<void>;
    /**
     * Store reset token
     */
    storeResetToken(token: string, userId: string, expirySeconds: number): Promise<void>;
    /**
     * Get user ID from reset token
     */
    getResetToken(token: string): Promise<string | null>;
    /**
     * Delete reset token
     */
    deleteResetToken(token: string): Promise<void>;
}
export declare const redisService: RedisService;
export {};
//# sourceMappingURL=redisService.d.ts.map