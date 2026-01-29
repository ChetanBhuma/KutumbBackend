
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function checkAuditLogs() {
    const logFile = path.join(process.cwd(), 'audit-check-result.txt');
    const logs = [];
    const log = (msg) => {
        const str = typeof msg === 'object' ? JSON.stringify(msg, null, 2) : String(msg);
        logs.push(str);
        console.log(str);
    };

    try {
        log('Checking AuditLog table...');

        const count = await prisma.auditLog.count();
        log(`Total Audit Logs: ${count}`);

        if (count > 0) {
            const recentLogs = await prisma.auditLog.findMany({
                take: 5,
                orderBy: { timestamp: 'desc' },
                include: { User: { select: { email: true, role: true } } }
            });
            log('Recent 5 Logs:');
            log(recentLogs);
        } else {
            log('No audit logs found. Checking User table to ensure DB is connected/seeded...');
            const userCount = await prisma.user.count();
            log(`Total Users: ${userCount}`);
        }

    } catch (error) {
        log(`Error: ${error}`);
    } finally {
        await prisma.$disconnect();
        fs.writeFileSync(logFile, logs.join('\n'));
        console.log('Check complete. Written to audit-check-result.txt');
    }
}

checkAuditLogs();
