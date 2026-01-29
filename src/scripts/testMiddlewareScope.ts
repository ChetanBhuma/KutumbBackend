
import { prisma } from '../config/database';
import { dataScopeMiddleware } from '../middleware/dataScopeMiddleware';

async function testScope() {
    try {
        console.log("Finding SHO user...");
        const user = await prisma.user.findFirst({
            where: { role: 'SHO' },
            include: {  officerProfile: true } // Correct relation name
        });

        if (!user) {
            console.log("No SHO user found.");
            return;
        }

        console.log(`Testing with User: ${user.email} (Role: ${user.role})`);

        // Mock Request object
        const req: any = {
            user: {
                id: user.id,
                role: user.role,
                officerId: user.officerId,
                email: user.email
            }
        };

        const res: any = {};
        const next = (err?: any) => {
            if (err) console.error("Middleware Error:", err);
            else console.log("Middleware called next()");
        };

        console.log("\n--- Executing Middleware ---");
        await dataScopeMiddleware(req, res, next);

        console.log("\n--- Result ---");
        console.log("req.dataScope:", JSON.stringify(req.dataScope, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

testScope();
