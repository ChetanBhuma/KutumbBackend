import Redis from 'ioredis';
import { logger } from './logger';
import EventEmitter from 'events';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');
const redisPassword = process.env.REDIS_PASSWORD;

// Helper to create a mock Redis client
const createMockRedis = () => {
    logger.warn('⚠️  Using MOCK Redis client (Memory-based)');
    const store = new Map<string, string>();
    const mock = new EventEmitter() as any;

    // Basic ioredis methods
    mock.get = async (key: string) => store.get(key) || null;
    mock.set = async (key: string, value: string, mode?: string, duration?: number) => {
        store.set(key, value);
        return 'OK';
    };
    mock.del = async (key: string) => {
        const existed = store.has(key);
        store.delete(key);
        return existed ? 1 : 0;
    };
    mock.exists = async (key: string) => store.has(key) ? 1 : 0;
    mock.expire = async (key: string, seconds: number) => 1;
    mock.status = 'ready';
    mock.on = (event: string, handler: any) => {
        if (event === 'connect' || event === 'ready') {
            setTimeout(() => handler(), 10);
        }
    };
    mock.disconnect = () => {};
    mock.quit = async () => 'OK';

    return mock;
};

// Create Redis client or Mock
let redisClient: any;

try {
    redisClient = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        lazyConnect: true, // Don't connect immediately
        retryStrategy: (times) => {
            const maxRetries = 2; // Shorten retries for "any how" mode
            if (times > maxRetries) {
                logger.error('Redis connection failed. Switching to MOCK Redis.');
                return null; // Stop retrying
            }
            return Math.min(times * 100, 1000);
        },
        maxRetriesPerRequest: 1
    });

    redisClient.on('error', (err: any) => {
        if (err.code === 'ECONNREFUSED' || err.message.includes('Max retries')) {
            logger.warn('Redis unavailable, but keeping client to try fallback logic if needed.');
        } else {
            logger.error('Redis client error:', err);
        }
    });

    // Attempt to connect, switch to mock on failure
    redisClient.connect().catch((err: any) => {
        logger.error('Initial Redis connection failed. Entering mock mode.');
        redisClient = createMockRedis();
    });

} catch (error) {
    logger.error('Failed to initialize Redis client. Using mock.');
    redisClient = createMockRedis();
}

// Event handlers for the real client (before potential swap)
if (redisClient.on) {
    redisClient.on('connect', () => logger.info('Redis client connected'));
    redisClient.on('ready', () => logger.info('Redis client ready'));
}

export { redisClient };
export default redisClient;

