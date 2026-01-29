
import { AuditService } from '../src/services/AuditService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function simulateLog() {
    try {
        console.log('Simulating audit log creation...');

        // Find a valid user to associate the log with
        const user = await prisma.user.findFirst();

        if (!user) {
            console.log('No users found to attach log to.');
            return;
        }

        await AuditService.log(
            user.id,
            'TEST_ACTION',
            'System',
            'test-id',
            { message: 'This is a test log from simulation script', status: 'success' },
            '127.0.0.1',
            'TestScript/1.0'
        );

        console.log('Log creation called. Verifying in DB...');

        const log = await prisma.auditLog.findFirst({
            where: { action: 'TEST_ACTION' },
            orderBy: { timestamp: 'desc' }
        });

        if (log) {
            console.log('SUCCESS: Log found in DB!');
            console.log(log);
        } else {
            console.log('FAILURE: Log not found in DB.');
        }

    } catch (error) {
        console.error('Error during simulation:', error);
    } finally {
        await prisma.$disconnect();
    }
}

simulateLog();
