import { createServer } from 'http';
import app from './app';
import { config } from './config';
import { logger } from './config/logger';
import { prisma } from './config/database';
import { websocketService } from './services/websocketService';
import { registerEventListeners } from './events/eventListeners';

const PORT = config.port;

// Create HTTP server
const httpServer = createServer(app);

// Initialize WebSocket
websocketService.initialize(httpServer);

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    // Close database connections
    await prisma.$disconnect();
    logger.info('Database connections closed');

    // Close server
    httpServer.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
    logger.error('Unhandled Rejection:', reason);
    process.exit(1);
});

import { SchedulerService } from './services/schedulerService';

// Initialize Scheduler
SchedulerService.init();

// Register event listeners (Added call)
registerEventListeners();

// Start server
// Start server

try {
    httpServer.listen(PORT, '0.0.0.0', () => {
        console.log('[DEBUG] Server listen callback triggered');
        logger.info(`Server running on port ${PORT} in ${config.env} mode`);
        logger.info(`API Documentation: http://localhost:${PORT}/api/${config.apiVersion}/docs`);
        logger.info(`Health Check: http://localhost:${PORT}/health`);
        logger.info(`WebSocket server running on port ${PORT}`);
    });

    httpServer.on('error', (err: any) => {
        console.error('[DEBUG] HTTP Server Error Event:', err);
        logger.error('HTTP Server Error:', err);
        process.exit(1);
    });

} catch (err) {
    console.error('[DEBUG] Accessing httpServer.listen failed:', err);
    process.exit(1);
}

export default httpServer;

// Export app for Vercel serverless functions
export { app };
