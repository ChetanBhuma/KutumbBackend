
import request from 'supertest';
import app from '../app';
import { prisma } from '../config/database';
import { TokenService } from '../services/tokenService';

const TARGET_EMAIL = 'shouttamnagar@gmail.com';

async function testRosterEndpoint() {
    console.log(`--- Testing GET /api/v1/masters/beats for: ${TARGET_EMAIL} ---`);

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
        role: user.role as any,
        officerId: user.officerId
    });
    console.log('✅ Generated Valid Token for User');

    const officerStationId = user.officerProfile?.policeStationId;
    console.log(`Expected Station ID: ${officerStationId} (${user.officerProfile?.PoliceStation?.name})`);

    // 3. Make Request (Simulating apiClient.getBeats)
    // Note: apiClient calls '/masters/beats', which usually maps to '/api/v1/masters/beats' in the backend app.
    // I need to confirm the route mapping in app.ts, but let's try the probable path.

    // We try both standard paths just in case
    const endpoints = ['/api/v1/masters/beats', '/api/v1/beats'];

    for (const endpoint of endpoints) {
        console.log(`\nTesting Endpoint: ${endpoint}`);
        const response = await request(app)
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`);

        console.log(`Status: ${response.status}`);
        if (response.status === 404) {
            console.log('Endpoint not found.');
            continue;
        }

        if (response.status !== 200) {
            console.error('❌ Request failed:', response.body);
            continue;
        }

        const beats = response.body.data || [];
        console.log(`Received ${beats.length} beats`);

        if (beats.length > 0) {
            const sample = beats[0];
            console.log('Sample Beat:', {
                id: sample.id,
                name: sample.name,
                policeStationId: sample.policeStationId,
                // Check if station name is included (depends on controller)
                stationName: sample.PoliceStation?.name
            });

            // Verification
            const failures = beats.filter((b: any) => b.policeStationId !== officerStationId);
            if (failures.length > 0) {
                console.error(`❌ FAILURE: User received ${failures.length} beats from WRONG station!`);
                console.error('First failure:', failures[0]);
            } else {
                console.log('✅ SUCCESS: All beats belong to correct station.');
            }
        } else {
             console.log('⚠️ No beats returned. (Secure, but empty)');
        }
    }
}

testRosterEndpoint().catch(console.error).finally(() => prisma.$disconnect());
