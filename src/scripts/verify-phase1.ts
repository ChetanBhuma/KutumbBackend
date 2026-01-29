import { prisma } from '../config/database';
import { redisService } from '../services/redisService';
import { logger } from '../config/logger';

async function main() {
    logger.info('Starting Phase 1 Verification...');

    // 1. Test Redis
    logger.info('Testing Redis...');
    try {
        await redisService.connect(); // Ensure connected
        await redisService.set('test_key', 'test_value', 60);
        const val = await redisService.get('test_key');
        if (val === 'test_value') {
            logger.info('✅ Redis Set/Get successful');
        } else {
            logger.error(`❌ Redis Set/Get failed. Expected 'test_value', got '${val}'`);
        }
    } catch (e) {
        logger.error('❌ Redis test failed:', e);
    }

    // 2. Test Database (User model)
    logger.info('Testing Database User model...');
    try {
        // Just count users to see if model exists and query works
        // @ts-ignore - in case types are not fully updated in IDE but runtime works
        const count = await prisma.user.count();
        logger.info(`✅ User model accessible. Current user count: ${count}`);
    } catch (e) {
        logger.error('❌ Database User model test failed:', e);
    }

    process.exit(0);
}

main();
