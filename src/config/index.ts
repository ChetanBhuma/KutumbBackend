import dotenv from 'dotenv';

dotenv.config();

export const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    apiVersion: process.env.API_VERSION || 'v1',

    database: {
        url: process.env.DATABASE_URL || ''
    },

    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-change-this',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'default-refresh-secret',
        refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
        issuer: process.env.JWT_ISSUER || 'senior-citizen-portal',
        audience: process.env.JWT_AUDIENCE || 'api'
    },

    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined
    },

    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
    },

    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
    },

    logging: {
        level: process.env.LOG_LEVEL || 'info',
        filePath: process.env.LOG_FILE_PATH || './logs'
    },

    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
        uploadDir: process.env.UPLOAD_DIR || './uploads'
    },

    sms: {
        gateway: process.env.SMS_GATEWAY || 'SIMULATED',
        apiKey: process.env.SMS_API_KEY || '',
        senderId: process.env.SMS_SENDER_ID || 'DelhiPolice'
    },

    email: {
        service: process.env.EMAIL_SERVICE || 'SIMULATED',
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        user: process.env.EMAIL_USER || '',
        password: process.env.EMAIL_PASSWORD || '',
        from: process.env.EMAIL_FROM || 'noreply@delhipolice.gov.in'
    }
};

// Validate critical secrets in production
if (config.env === 'production') {
    const requiredSecrets = [
        'JWT_SECRET',
        'REFRESH_TOKEN_SECRET',
        'DATABASE_URL'
    ];

    const missingSecrets = requiredSecrets.filter(secret => !process.env[secret]);

    if (missingSecrets.length > 0) {
        throw new Error(`Missing critical environment variables in production: ${missingSecrets.join(', ')}`);
    }
}
