"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
class TokenService {
    /**
     * Generate access token (short-lived)
     */
    static generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.secret, {
            expiresIn: config_1.config.jwt.expiresIn,
            issuer: config_1.config.jwt.issuer,
            audience: config_1.config.jwt.audience
        });
    }
    /**
     * Generate refresh token (long-lived)
     */
    static generateRefreshToken(payload) {
        return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.refreshSecret, {
            expiresIn: config_1.config.jwt.refreshExpiresIn,
            issuer: config_1.config.jwt.issuer,
            audience: 'refresh' // Refresh tokens usually have a specific audience or handling
        });
    }
    /**
     * Generate both access and refresh tokens
     */
    static generateTokenPair(payload) {
        return {
            accessToken: this.generateAccessToken(payload),
            refreshToken: this.generateRefreshToken(payload)
        };
    }
    /**
     * Verify access token
     */
    static verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret, {
                issuer: config_1.config.jwt.issuer,
                audience: config_1.config.jwt.audience
            });
        }
        catch (error) {
            throw new Error('Invalid or expired access token');
        }
    }
    /**
     * Verify refresh token
     */
    static verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, config_1.config.jwt.refreshSecret, {
                issuer: config_1.config.jwt.issuer,
                audience: 'refresh'
            });
        }
        catch (error) {
            throw new Error('Invalid or expired refresh token');
        }
    }
    /**
     * Decode token without verification (for debugging)
     */
    static decodeToken(token) {
        return jsonwebtoken_1.default.decode(token);
    }
}
exports.TokenService = TokenService;
//# sourceMappingURL=tokenService.js.map