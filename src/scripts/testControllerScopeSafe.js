
const { PrismaClient } = require('@prisma/client');
const { dataScopeMiddleware } = require('../middleware/dataScopeMiddleware');
const { BeatController } = require('../controllers/beatController');

const prisma = new PrismaClient();

async function testControllerScope() {
    try {
        console.log("Setting up test...");

        // 1. Find SHO User
        const user = await prisma.user.findFirst({
            where: { role: 'SHO' },
            include: { officerProfile: true }
        });

        if (!user) {
            console.error("No SHO user found");
            return;
        }

        console.log(`User: ${user.email}, Role: ${user.role}`);
        if (user.officerProfile) {
            console.log(`Officer Station: ${user.officerProfile.policeStationId}`);
        }

        // 2. Mock Request
        const req = {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                officerId: user.officerId
            },
            query: {}, // Empty query
            headers: {}
        };

        // 3. Mock Response
        const res = {
            json: (data) => {
                console.log("\n--- Controller Response ---");
                if (data.success) {
                    console.log(`Returned ${data.data.length} beats.`);
                    if (data.data.length > 0) {
                        const first = data.data[0];
                        console.log("First Beat:", {
                            name: first.name,
                            policeStationId: first.policeStationId
                        });

                        // Check logic
                        if (user.officerProfile && first.policeStationId !== user.officerProfile.policeStationId) {
                            console.error(`FAILURE: Beat Station (${first.policeStationId}) != User Station (${user.officerProfile.policeStationId})`);
                        } else {
                            console.log("SUCCESS: Beat station matches user station.");
                        }
                    } else {
                        console.log("Returned 0 beats. Filtering might be too strict or no beats exist.");
                    }
                } else {
                    console.log("Response:", data);
                }
            },
            status: (code) => {
                console.log(`Status set to ${code}`);
                return res;
            }
        };

        const next = (err) => {
            if (err) console.error("Middleware Next Error:", err);
            else console.log("Middleware called next()");
        };

        // 4. Run Middleware
        console.log("\nRunning dataScopeMiddleware...");
        await dataScopeMiddleware(req, res, next);

        console.log("\nMiddleware Result Scope:", JSON.stringify(req.dataScope, null, 2));

        // 5. Run Controller
        console.log("\nRunning BeatController.list...");
        await BeatController.list(req, res, next);

    } catch (e) {
        console.error("Test Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

testControllerScope();
