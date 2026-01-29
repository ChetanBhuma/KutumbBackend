export interface OTP {
    code: string;
    expiresAt: Date;
}
export declare class OTPService {
    private static readonly OTP_EXPIRY_MINUTES;
    /**
     * Generate a random OTP
     */
    static generate(): OTP;
    /**
     * Verify OTP
     */
    static verify(inputCode: string, storedCode: string, expiresAt: Date): boolean;
    /**
     * Check if OTP has expired
     */
    static isExpired(expiresAt: Date): boolean;
    /**
     * Get remaining time in seconds
     */
    static getRemainingTime(expiresAt: Date): number;
}
//# sourceMappingURL=otpService.d.ts.map