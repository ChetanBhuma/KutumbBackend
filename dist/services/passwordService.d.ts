export declare class PasswordService {
    private static readonly SALT_ROUNDS;
    /**
     * Hash a password
     */
    static hash(password: string): Promise<string>;
    /**
     * Compare password with hash
     */
    static compare(password: string, hash: string): Promise<boolean>;
    /**
     * Validate password strength
     * Requirements:
     * - At least 8 characters
     * - At least one uppercase letter
     * - At least one lowercase letter
     * - At least one number
     * - At least one special character
     */
    static validateStrength(password: string): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=passwordService.d.ts.map