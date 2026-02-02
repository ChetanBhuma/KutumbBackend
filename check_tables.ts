
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTables() {
    try {
        // Check permission count
        const perms = await prisma.$queryRaw<any[]>`SELECT count(*) as count FROM "Permission"`;
        console.log('Permission Count:', perms);

        // Check tables like _RolePermissions
        const tables = await prisma.$queryRaw<any[]>`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_name LIKE '%RolePermissions%'
        `;
        console.log('Join Tables:', tables);

        // Check columns of _RolePermissions if it exists
        if (tables.length > 0) {
            const tableName = tables[0].table_name;
            const columns = await prisma.$queryRaw`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = ${tableName}
            `;
            console.log(`Columns of ${tableName}:`, columns);
        }

    } catch (error) {
        console.error('Error checking tables:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTables();
