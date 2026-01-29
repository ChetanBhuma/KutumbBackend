interface BannedIP {
    ip: string;
    reason: string;
    bannedAt: Date;
    expiresAt?: Date;
    permanent: boolean;
}
export declare class IPBanService {
    private static readonly BAN_PREFIX;
    private static readonly FAILED_ATTEMPTS_PREFIX;
    private static readonly MAX_FAILED_ATTEMPTS;
    private static readonly BAN_DURATION;
    private static readonly ATTEMPT_WINDOW;
    /**
     * Check if IP is banned
     */
    static isIPBanned(ip: string): Promise<boolean>;
    /**
     * Ban an IP address
     */
    static banIP(ip: string, reason: string, permanent?: boolean, durationSeconds?: number): Promise<void>;
    /**
     * Unban an IP address
     */
    static unbanIP(ip: string): Promise<void>;
    /**
     * Get ban details
     */
    static getBanDetails(ip: string): Promise<BannedIP | null>;
    /**
     * Record failed attempt
     */
    static recordFailedAttempt(ip: string): Promise<void>;
    /**
     * Clear failed attempts for IP
     */
    static clearFailedAttempts(ip: string): Promise<void>;
    /**
     * Get failed attempts count
     */
    static getFailedAttemptsCount(ip: string): Promise<number>;
    /**
     * Get all banned IPs (for admin dashboard)
     */
    static getAllBannedIPs(): Promise<BannedIP[]>;
}
export {};
//# sourceMappingURL=ipBanService.d.ts.map