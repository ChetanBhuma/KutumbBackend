
import { prisma } from '../config/database';
import { TokenService } from '../services/tokenService';

const TARGET_EMAIL = 'shouttamnagar@gmail.com';
const API_BASE = 'http://localhost:5000/api/v1';

async function testRosterLive() {
    console.log(`--- Testing Live API for: ${TARGET_EMAIL} ---`);

    // 1. Get User
    const user = await prisma.user.findUnique({
        where: { email: TARGET_EMAIL },
        include: { officerProfile: { include: { PoliceStation: true } } }
    });

    if (!user) {
        console.error('❌ User not found!');
        return;
    }

    // 2. Generate Token
    const token = TokenService.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        officerId: user.officerId
    });
    console.log('✅ Generated Token');

    const officerStationId = user.officerProfile?.policeStationId;
    console.log(`Expected Station: ${user.officerProfile?.PoliceStation?.name}`);

    // 3. Test Endpoints
    const endpoints = ['/masters/beats']; // Client uses this path

    for (const path of endpoints) {
        const url = `${API_BASE}${path}`;
        console.log(`\nFetching: ${url}`);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`Status: ${response.status}`);

            if (response.ok) {
                const json = await response.json();
                const beats = json.data || [];
                console.log(`Received ${beats.length} beats`);

                if (beats.length > 0) {
                    console.log('Sample:', {
                        id: beats[0].id,
                        name: beats[0].name,
                        stationId: beats[0].policeStationId,
                        station: beats[0].PoliceStation?.name
                    });

                    // Validate
                    const failures = beats.filter((b: any) => b.policeStationId !== officerStationId);
                    if (failures.length > 0) {
                        console.error('❌ FAILURE: Received beats from wrong station!');
                        console.table(failures.map((f: any) => ({ name: f.name, station: f.PoliceStation?.name })));
                    } else {
                        console.log('✅ SUCCESS: All beats match expected station.');
                    }
                } else {
                    console.log('⚠️ Empty list returned.');
                }
            } else {
                const text = await response.text();
                console.error('❌ Request failed:', text);
            }

        } catch (err: any) {
            console.error('❌ Network/Fetch Error:', err.message);
            if (err.cause) console.error('Cause:', err.cause);
        }
    }
}

testRosterLive().catch(console.error).finally(() => prisma.$disconnect());
