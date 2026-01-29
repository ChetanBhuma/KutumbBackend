"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
class SchedulerService {
    static init() {
        // Daily report generation at 00:00
        node_cron_1.default.schedule('0 0 * * *', async () => {
            logger_1.auditLogger.info('Running daily report generation job...');
            try {
                const totalCitizens = await database_1.prisma.seniorCitizen.count();
                const totalVisits = await database_1.prisma.visit.count();
                const activeAlerts = await database_1.prisma.sOSAlert.count({ where: { status: 'Active' } });
                logger_1.auditLogger.info('Daily report generated', {
                    totalCitizens,
                    totalVisits,
                    activeAlerts
                });
            }
            catch (error) {
                logger_1.auditLogger.error('Error running daily report job:', error);
            }
        });
        // Vulnerability-based visit scheduling - Every day at 6 AM
        node_cron_1.default.schedule('0 6 * * *', async () => {
            logger_1.auditLogger.info('Running vulnerability-based visit scheduling...');
            try {
                const { scheduleVulnerabilityBasedVisits } = await Promise.resolve().then(() => __importStar(require('../utils/vulnerabilityScheduling')));
                const result = await scheduleVulnerabilityBasedVisits();
                logger_1.auditLogger.info('Vulnerability scheduling completed', result);
            }
            catch (error) {
                logger_1.auditLogger.error('Error in vulnerability scheduling:', error);
            }
        });
        // SLA monitoring - Every 5 minutes
        node_cron_1.default.schedule('*/5 * * * *', async () => {
            try {
                const { monitorSLABreaches } = await Promise.resolve().then(() => __importStar(require('../utils/slaMonitoring')));
                const breaches = await monitorSLABreaches();
                if (breaches.length > 0) {
                    logger_1.auditLogger.warn(`SLA Breaches detected: ${breaches.length}`, { breaches });
                }
            }
            catch (error) {
                logger_1.auditLogger.error('Error in SLA monitoring:', error);
            }
        });
        logger_1.auditLogger.info('Scheduler initialized with all cron jobs');
    }
}
exports.SchedulerService = SchedulerService;
//# sourceMappingURL=schedulerService.js.map