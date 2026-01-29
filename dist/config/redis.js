"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("./logger");
const events_1 = __importDefault(require("events"));
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');
const redisPassword = process.env.REDIS_PASSWORD;
// Helper to create a mock Redis client
const createMockRedis = () => {
    logger_1.logger.warn('⚠️  Using MOCK Redis client (Memory-based)');
    const store = new Map();
    const mock = new events_1.default();
    // Basic ioredis methods
    mock.get = async (key) => store.get(key) || null;
    mock.set = async (key, value, mode, duration) => {
        store.set(key, value);
        return 'OK';
    };
    mock.del = async (key) => {
        const existed = store.has(key);
        store.delete(key);
        return existed ? 1 : 0;
    };
    mock.exists = async (key) => store.has(key) ? 1 : 0;
    mock.expire = async (key, seconds) => 1;
    mock.status = 'ready';
    mock.on = (event, handler) => {
        if (event === 'connect' || event === 'ready') {
            setTimeout(() => handler(), 10);
        }
    };
    mock.disconnect = () => { };
    mock.quit = async () => 'OK';
    return mock;
};
// Create Redis client or Mock
let redisClient;
try {
    exports.redisClient = redisClient = new ioredis_1.default({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        lazyConnect: true, // Don't connect immediately
        retryStrategy: (times) => {
            const maxRetries = 2; // Shorten retries for "any how" mode
            if (times > maxRetries) {
                logger_1.logger.error('Redis connection failed. Switching to MOCK Redis.');
                return null; // Stop retrying
            }
            return Math.min(times * 100, 1000);
        },
        maxRetriesPerRequest: 1
    });
    redisClient.on('error', (err) => {
        if (err.code === 'ECONNREFUSED' || err.message.includes('Max retries')) {
            logger_1.logger.warn('Redis unavailable, but keeping client to try fallback logic if needed.');
        }
        else {
            logger_1.logger.error('Redis client error:', err);
        }
    });
    // Attempt to connect, switch to mock on failure
    redisClient.connect().catch((err) => {
        logger_1.logger.error('Initial Redis connection failed. Entering mock mode.');
        exports.redisClient = redisClient = createMockRedis();
    });
}
catch (error) {
    logger_1.logger.error('Failed to initialize Redis client. Using mock.');
    exports.redisClient = redisClient = createMockRedis();
}
// Event handlers for the real client (before potential swap)
if (redisClient.on) {
    redisClient.on('connect', () => logger_1.logger.info('Redis client connected'));
    redisClient.on('ready', () => logger_1.logger.info('Redis client ready'));
}
exports.default = redisClient;
//# sourceMappingURL=redis.js.map