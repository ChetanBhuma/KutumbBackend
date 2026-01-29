export interface OTPResult {
    success: boolean;
    message: string;
    expiresAt?: Date;
    otp?: string;
}
export interface AuthResult {
    success: boolean;
    message: string;
    accessToken?: string;
    refreshToken?: string;
    citizen?: any;
}
/**
 * Generate 6-digit OTP
 */
export declare const generateOTP: () => string;
/**
 * Send OTP via SMS
 * TODO: Integrate with actual SMS gateway (Twilio, AWS SNS, etc.)
 */
export declare const sendOTP: (mobileNumber: string, otp: string) => Promise<boolean>;
/**
 * Check if mobile number is registered
 */
export declare const checkRegistration: (mobileNumber: string) => Promise<{
    isRegistered: boolean;
}>;
/**
 * Request OTP for mobile number
 */
/**
 * Request OTP for mobile number
 */
export declare const requestOTP: (mobileNumber: string, requireRegistered?: boolean) => Promise<OTPResult>;
/**
 * Verify OTP
 */
/**
 * Verify OTP and login
 */
export declare const verifyOTP: (mobileNumber: string, otp: string) => Promise<AuthResult>;
/**
 * Register citizen with password
 */
export declare const registerCitizen: (mobileNumber: string, password: string) => Promise<AuthResult>;
/**
 * Login citizen
 */
export declare const loginCitizen: (mobileNumber: string, password: string, ipAddress?: string) => Promise<AuthResult>;
/**
 * Forgot password - send OTP
 */
export declare const forgotPassword: (mobileNumber: string) => Promise<OTPResult>;
/**
 * Reset password with OTP
 */
export declare const resetPassword: (mobileNumber: string, otp: string, newPassword: string) => Promise<AuthResult>;
/**
 * Verify refresh token and generate new tokens
 */
export declare const verifyRefreshToken: (refreshToken: string) => Promise<{
    success: boolean;
    message: string;
    accessToken?: undefined;
    refreshToken?: undefined;
    userId?: undefined;
} | {
    success: boolean;
    message: string;
    accessToken: string;
    refreshToken: string;
    userId: any;
}>;
/**
 * Logout citizen by clearing refresh token
 */
export declare const logout: (mobileNumber: string) => Promise<boolean>;
//# sourceMappingURL=citizenAuthService.d.ts.map