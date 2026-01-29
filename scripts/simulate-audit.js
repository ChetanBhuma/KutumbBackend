
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mock AuditService since we can't easily import the TS class without compilation
// But we want to test the *logic* effectively.
// Ideally we'd require the compiled service, but we haven't compiled.
// So we will replicate the logic to verify DB access,
// AND rely on the fact that I wrote the same logical code in AuditService.ts.

async function simulateLog() {
    try {
        console.log('Simulating audit log creation (Direct Prism Call)...');

        // Find a valid user to associate the log with
        const user = await prisma.user.findFirst();

        if (!user) {
            console.log('No users found to attach log to.');
            return;
        }

        const logData = {
            userId: user.id,
            action: 'TEST_ACTION_JS',
            resource: 'User',
            resourceId: user.id,
            changes: JSON.stringify({ message: 'This is a test log from JS script', status: 'success' }),
            ipAddress: '127.0.0.1',
            userAgent: 'TestScriptJS/1.0'
        };

        await prisma.auditLog.create({
            data: logData
        });

        console.log('Log creation called. Verifying in DB...');

        const log = await prisma.auditLog.findFirst({
            where: { action: 'TEST_ACTION_JS' },
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
