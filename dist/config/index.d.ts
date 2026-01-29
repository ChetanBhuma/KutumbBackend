export declare const config: {
    env: string;
    port: number;
    apiVersion: string;
    database: {
        url: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshSecret: string;
        refreshExpiresIn: string;
        issuer: string;
        audience: string;
    };
    redis: {
        host: string;
        port: number;
        password: string | undefined;
    };
    cors: {
        origin: string;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    logging: {
        level: string;
        filePath: string;
    };
    upload: {
        maxFileSize: number;
        uploadDir: string;
    };
    sms: {
        gateway: string;
        apiKey: string;
        senderId: string;
    };
    email: {
        service: string;
        host: string;
        port: number;
        user: string;
        password: string;
        from: string;
    };
};
//# sourceMappingURL=index.d.ts.map