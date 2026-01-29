import cron from 'node-cron';
import { prisma } from '../config/database';
import { auditLogger } from '../config/logger';

export class SchedulerService {
    static init() {
        // Daily report generation at 00:00
        cron.schedule('0 0 * * *', async () => {
            auditLogger.info('Running daily report generation job...');
            try {
                const totalCitizens = await prisma.seniorCitizen.count();
                const totalVisits = await prisma.visit.count();
                const activeAlerts = await prisma.sOSAlert.count({ where: { status: 'Active' } });

                auditLogger.info('Daily report generated', {
                    totalCitizens,
                    totalVisits,
                    activeAlerts
                });
            } catch (error) {
                auditLogger.error('Error running daily report job:', error);
            }
        });

        // Vulnerability-based visit scheduling - Every day at 6 AM
        cron.schedule('0 6 * * *', async () => {
            auditLogger.info('Running vulnerability-based visit scheduling...');
            try {
                const { scheduleVulnerabilityBasedVisits } = await import('../utils/vulnerabilityScheduling');
                const result = await scheduleVulnerabilityBasedVisits();
                auditLogger.info('Vulnerability scheduling completed', result);
            } catch (error) {
                auditLogger.error('Error in vulnerability scheduling:', error);
            }
        });

        // SLA monitoring - Every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            try {
                const { monitorSLABreaches } = await import('../utils/slaMonitoring');
                const breaches = await monitorSLABreaches();

                if (breaches.length > 0) {
                    auditLogger.warn(`SLA Breaches detected: ${breaches.length}`, { breaches });
                }
            } catch (error) {
                auditLogger.error('Error in SLA monitoring:', error);
            }
        });

        auditLogger.info('Scheduler initialized with all cron jobs');
    }
}
