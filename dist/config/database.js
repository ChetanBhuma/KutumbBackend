"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("./logger");
const prismaMiddleware_1 = require("../middleware/prismaMiddleware");
// Create Prisma client instance
exports.prisma = new client_1.PrismaClient({
    log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' }
    ]
});
// Register middleware
exports.prisma.$use(prismaMiddleware_1.softDeleteMiddleware);
exports.prisma.$use(prismaMiddleware_1.performanceMiddleware);
// Log database queries in development
if (process.env.NODE_ENV === 'development') {
    exports.prisma.$on('query', (e) => {
        logger_1.logger.debug(`Query: ${e.query}`);
        logger_1.logger.debug(`Duration: ${e.duration}ms`);
    });
}
// Log database errors
exports.prisma.$on('error', (e) => {
    logger_1.logger.error('Database error:', e);
});
// Log database warnings
exports.prisma.$on('warn', (e) => {
    logger_1.logger.warn('Database warning:', e);
});
// Test database connection
const connectDatabase = async () => {
    try {
        await exports.prisma.$connect();
        logger_1.logger.info('✅ Database connected successfully');
    }
    catch (error) {
        logger_1.logger.error('❌ Database connection failed:', error);
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
//# sourceMappingURL=database.js.map