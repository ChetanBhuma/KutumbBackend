"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const redisService_1 = require("../services/redisService");
const logger_1 = require("../config/logger");
async function main() {
    logger_1.logger.info('Starting Phase 1 Verification...');
    // 1. Test Redis
    logger_1.logger.info('Testing Redis...');
    try {
        await redisService_1.redisService.connect(); // Ensure connected
        await redisService_1.redisService.set('test_key', 'test_value', 60);
        const val = await redisService_1.redisService.get('test_key');
        if (val === 'test_value') {
            logger_1.logger.info('✅ Redis Set/Get successful');
        }
        else {
            logger_1.logger.error(`❌ Redis Set/Get failed. Expected 'test_value', got '${val}'`);
        }
    }
    catch (e) {
        logger_1.logger.error('❌ Redis test failed:', e);
    }
    // 2. Test Database (User model)
    logger_1.logger.info('Testing Database User model...');
    try {
        // Just count users to see if model exists and query works
        // @ts-ignore - in case types are not fully updated in IDE but runtime works
        const count = await database_1.prisma.user.count();
        logger_1.logger.info(`✅ User model accessible. Current user count: ${count}`);
    }
    catch (e) {
        logger_1.logger.error('❌ Database User model test failed:', e);
    }
    process.exit(0);
}
main();
//# sourceMappingURL=verify-phase1.js.map