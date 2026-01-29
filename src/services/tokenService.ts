import jwt from 'jsonwebtoken';
import { config } from '../config';
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

export class TokenService {
    /**
     * Generate access token (short-lived)
     */
    static generateAccessToken(payload: TokenPayload): string {
        return jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn as string,
            issuer: config.jwt.issuer,
            audience: config.jwt.audience
        } as jwt.SignOptions);
    }

    /**
     * Generate refresh token (long-lived)
     */
    static generateRefreshToken(payload: TokenPayload): string {
        return jwt.sign(payload, config.jwt.refreshSecret, {
            expiresIn: config.jwt.refreshExpiresIn as string,
            issuer: config.jwt.issuer,
            audience: 'refresh' // Refresh tokens usually have a specific audience or handling
        } as jwt.SignOptions);
    }

    /**
     * Generate both access and refresh tokens
     */
    static generateTokenPair(payload: TokenPayload): TokenPair {
        return {
            accessToken: this.generateAccessToken(payload),
            refreshToken: this.generateRefreshToken(payload)
        };
    }

    /**
     * Verify access token
     */
    static verifyAccessToken(token: string): TokenPayload {
        try {
            return jwt.verify(token, config.jwt.secret, {
                issuer: config.jwt.issuer,
                audience: config.jwt.audience
            }) as TokenPayload;
        } catch (error) {
            throw new Error('Invalid or expired access token');
        }
    }

    /**
     * Verify refresh token
     */
    static verifyRefreshToken(token: string): TokenPayload {
        try {
            return jwt.verify(token, config.jwt.refreshSecret, {
                issuer: config.jwt.issuer,
                audience: 'refresh'
            }) as TokenPayload;
        } catch (error) {
            throw new Error('Invalid or expired refresh token');
        }
    }

    /**
     * Decode token without verification (for debugging)
     */
    static decodeToken(token: string): any {
        return jwt.decode(token);
    }
}
