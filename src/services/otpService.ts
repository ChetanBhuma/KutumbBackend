import crypto from 'crypto';

export interface OTP {
    code: string;
    expiresAt: Date;
}

export class OTPService {
    private static readonly OTP_EXPIRY_MINUTES = 10;

    /**
     * Generate a random OTP
     */
    static generate(): OTP {
        const code = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

        return { code, expiresAt };
    }

    /**
     * Verify OTP
     */
    static verify(inputCode: string, storedCode: string, expiresAt: Date): boolean {
        // Check if OTP has expired
        if (new Date() > expiresAt) {
            return false;
        }

        // Compare codes (constant-time comparison to prevent timing attacks)
        return crypto.timingSafeEqual(
            Buffer.from(inputCode),
            Buffer.from(storedCode)
        );
    }

    /**
     * Check if OTP has expired
     */
    static isExpired(expiresAt: Date): boolean {
        return new Date() > expiresAt;
    }

    /**
     * Get remaining time in seconds
     */
    static getRemainingTime(expiresAt: Date): number {
        const now = new Date();
        const remaining = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
        return Math.max(0, remaining);
    }
}
