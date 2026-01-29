"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTPService = void 0;
const crypto_1 = __importDefault(require("crypto"));
class OTPService {
    static OTP_EXPIRY_MINUTES = 10;
    /**
     * Generate a random OTP
     */
    static generate() {
        const code = crypto_1.default.randomInt(100000, 999999).toString();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);
        return { code, expiresAt };
    }
    /**
     * Verify OTP
     */
    static verify(inputCode, storedCode, expiresAt) {
        // Check if OTP has expired
        if (new Date() > expiresAt) {
            return false;
        }
        // Compare codes (constant-time comparison to prevent timing attacks)
        return crypto_1.default.timingSafeEqual(Buffer.from(inputCode), Buffer.from(storedCode));
    }
    /**
     * Check if OTP has expired
     */
    static isExpired(expiresAt) {
        return new Date() > expiresAt;
    }
    /**
     * Get remaining time in seconds
     */
    static getRemainingTime(expiresAt) {
        const now = new Date();
        const remaining = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
        return Math.max(0, remaining);
    }
}
exports.OTPService = OTPService;
//# sourceMappingURL=otpService.js.map