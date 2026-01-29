"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const logger_1 = require("./config/logger");
const database_1 = require("./config/database");
const websocketService_1 = require("./services/websocketService");
const eventListeners_1 = require("./events/eventListeners");
const PORT = config_1.config.port;
// Create HTTP server
const httpServer = (0, http_1.createServer)(app_1.default);
// Initialize WebSocket
websocketService_1.websocketService.initialize(httpServer);
// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
    logger_1.logger.info(`${signal} received. Starting graceful shutdown...`);
    // Close database connections
    await database_1.prisma.$disconnect();
    logger_1.logger.info('Database connections closed');
    // Close server
    httpServer.close(() => {
        logger_1.logger.info('HTTP server closed');
        process.exit(0);
    });
};
// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
    logger_1.logger.error('Unhandled Rejection:', reason);
    process.exit(1);
});
const schedulerService_1 = require("./services/schedulerService");
// Initialize Scheduler
schedulerService_1.SchedulerService.init();
// Register event listeners (Added call)
(0, eventListeners_1.registerEventListeners)();
// Start server
// Start server
console.log('[DEBUG] Starting server initialization...');
try {
    httpServer.listen(PORT, '0.0.0.0', () => {
        console.log('[DEBUG] Server listen callback triggered');
        logger_1.logger.info(`Server running on port ${PORT} in ${config_1.config.env} mode`);
        logger_1.logger.info(`API Documentation: http://localhost:${PORT}/api/${config_1.config.apiVersion}/docs`);
        logger_1.logger.info(`Health Check: http://localhost:${PORT}/health`);
        logger_1.logger.info(`WebSocket server running on port ${PORT}`);
    });
    httpServer.on('error', (err) => {
        console.error('[DEBUG] HTTP Server Error Event:', err);
        logger_1.logger.error('HTTP Server Error:', err);
        process.exit(1);
    });
}
catch (err) {
    console.error('[DEBUG] Accessing httpServer.listen failed:', err);
    process.exit(1);
}
exports.default = httpServer;
//# sourceMappingURL=server.js.map