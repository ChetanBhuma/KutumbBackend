
// @ts-nocheck
import { prisma } from '../config/database';
import { dataScopeMiddleware } from '../middleware/dataScopeMiddleware';
import { BeatController } from '../controllers/beatController';
import * as fs from 'fs';

const LOG_FILE = 'debug_result.txt';
fs.writeFileSync(LOG_FILE, 'STARTING TEST\n');

function log(msg: any) {
    const str = typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2);
    fs.appendFileSync(LOG_FILE, str + '\n');
    console.log(str);
}


console.log("TS-NODE STARTED");

async function testControllerScope() {
    try {
        console.log("Setting up test...");

        // 1. Find SHO User
        const user: any = await prisma.user.findFirst({
            where: { role: 'SHO' },
            include: { officerProfile: true }
        });

        if (!user) {
            log("No SHO user found");
            return;
        }

        console.log(`User: ${user.email}, Role: ${user.role}`);
        if (user.officerProfile) {
            log(`Officer Station: ${user.officerProfile.policeStationId}`);
        }

        // 2. Mock Request
        const req: any = {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                officerId: user.officerId
            },
            query: {}, // Empty query from frontend
            headers: {}
        };

        // 3. Mock Response
        const res: any = {
            json: (data: any) => {
                log("\n--- Controller Response ---");
                if (data.success) {
                    log(`Returned ${data.data.length} beats.`);
                    if (data.data.length > 0) {
                        const first = data.data[0];
                        log({ firstBeat: first.name, stationId: first.policeStationId });

                        // Check logic
                        const userStation = user.officerProfile?.policeStationId;
                        if (userStation && first.policeStationId !== userStation) {
                            log(`FAILURE: Beat Station (${first.policeStationId}) != User Station (${userStation})`);
                        } else {
                            log("SUCCESS: Beat station matches user station.");
                        }
                    } else {
                        log("Returned 0 beats.");
                    }
                } else {
                    log("Response Error: " + JSON.stringify(data));
                }
            },
            status: (code: number) => {
                log(`Status set to ${code}`);
                return res;
            }
        };

        const nextResult: any = (err?: any) => {
            if (err) log("Middleware Next Error: " + err);
            else log("Middleware called next()");
        };

        // 4. Run Middleware
        log("\nRunning dataScopeMiddleware...");
        await dataScopeMiddleware(req, res, nextResult);

        log("\nMiddleware Result Scope: " + JSON.stringify(req.dataScope, null, 2));

        // 5. Run Controller
        log("\nRunning BeatController.list...");
        await BeatController.list(req, res, nextResult);

    } catch (e) {
        log("Test Error: " + e);
    } finally {
        await prisma.$disconnect();
    }
}

testControllerScope();
