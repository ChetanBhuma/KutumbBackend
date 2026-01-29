import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import { softDeleteMiddleware, performanceMiddleware } from '../middleware/prismaMiddleware';

// Create Prisma client instance
export const prisma = new PrismaClient({
    log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' }
    ]
});

// Register middleware
prisma.$use(softDeleteMiddleware);
prisma.$use(performanceMiddleware);


// Log database queries in development
if (process.env.NODE_ENV === 'development') {
    prisma.$on('query' as never, (e: any) => {
        logger.debug(`Query: ${e.query}`);
        logger.debug(`Duration: ${e.duration}ms`);
    });
}

// Log database errors
prisma.$on('error' as never, (e: any) => {
    logger.error('Database error:', e);
});

// Log database warnings
prisma.$on('warn' as never, (e: any) => {
    logger.warn('Database warning:', e);
});

// Test database connection
export const connectDatabase = async () => {
    try {
        await prisma.$connect();
        logger.info('✅ Database connected successfully');
    } catch (error) {
        logger.error('❌ Database connection failed:', error);
        process.exit(1);
    }
};
