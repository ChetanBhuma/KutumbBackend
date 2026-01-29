import { Role } from '../types/auth';
export interface TokenPayload {
    userId: string;
    email: string;
    role: Role;
    citizenId?: string;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export declare class TokenService {
    /**
     * Generate access token (short-lived)
     */
    static generateAccessToken(payload: TokenPayload): string;
    /**
     * Generate refresh token (long-lived)
     */
    static generateRefreshToken(payload: TokenPayload): string;
    /**
     * Generate both access and refresh tokens
     */
    static generateTokenPair(payload: TokenPayload): TokenPair;
    /**
     * Verify access token
     */
    static verifyAccessToken(token: string): TokenPayload;
    /**
     * Verify refresh token
     */
    static verifyRefreshToken(token: string): TokenPayload;
    /**
     * Decode token without verification (for debugging)
     */
    static decodeToken(token: string): any;
}
//# sourceMappingURL=tokenService.d.ts.map