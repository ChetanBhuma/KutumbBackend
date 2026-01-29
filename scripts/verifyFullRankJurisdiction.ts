import prisma from '../src/config/prisma';
import { dataScopeMiddleware } from '../src/middleware/dataScopeMiddleware';
import { Response } from 'express';

async function verify() {
    console.log("Starting Jurisdiction Verification...");

    // Fetch valid IDs from DB to satisfy FK constraints
    const range = await prisma.range.findFirst();
    const district = await prisma.district.findFirst();
    const subDivision = await prisma.subDivision.findFirst();
    const psa = await prisma.policeStation.findFirst();
    const beat = await prisma.beat.findFirst();

    if (!range || !district || !subDivision || !psa || !beat) {
        console.error("Missing Master Data for verification (Range/District/etc not found)");
        return;
    }

    const mockIds = {
        rangeId: range.id,
        districtId: district.id,
        subDivisionId: subDivision.id,
        policeStationId: psa.id,
        beatId: beat.id
    };

    // Create a temp officer to fetch

    // Create a temp officer to fetch
    const officer = await prisma.beatOfficer.create({
        data: {
            name: "Jurisdiction Tester",
            rank: "TEST",
            badgeNumber: `TEST-${Date.now()}`,
            mobileNumber: `00000${Date.now().toString().slice(0,5)}`,
            email: `test.officer.${Date.now()}@delhipolice.gov.in`,
            rangeId: mockIds.rangeId,
            districtId: mockIds.districtId,
            subDivisionId: mockIds.subDivisionId,
            policeStationId: mockIds.policeStationId,
            beatId: mockIds.beatId
        }
    });

    try {
        const testCases = [
            { role: 'ADDL_DCP', expectedLevel: 'DISTRICT', expectedIdKey: 'districtId' },
            { role: 'ACP', expectedLevel: 'SUBDIVISION', expectedIdKey: 'subDivisionId' },
            { role: 'INSPECTOR', expectedLevel: 'POLICE_STATION', expectedIdKey: 'policeStationId' },
            { role: 'SHO', expectedLevel: 'POLICE_STATION', expectedIdKey: 'policeStationId' },
            { role: 'SUB_INSPECTOR', expectedLevel: 'BEAT', expectedIdKey: 'beatId' },
            { role: 'HEAD_CONSTABLE', expectedLevel: 'BEAT', expectedIdKey: 'beatId' },
            { role: 'CONSTABLE', expectedLevel: 'BEAT', expectedIdKey: 'beatId' },
            { role: 'BEAT_OFFICER', expectedLevel: 'BEAT', expectedIdKey: 'beatId' }
        ];

        for (const test of testCases) {
            console.log(`Testing Role: ${test.role}...`);

            const req: any = {
                user: {
                    role: test.role,
                    officerId: officer.id
                }
            };
            const res = {} as Response;
            const next = (err?: any) => {
                if (err) console.error("Middleware Error:", err);
            };

            await dataScopeMiddleware(req, res, next);

            const scope = req.dataScope;

            if (scope && scope.level === test.expectedLevel) {
                 // Check ID
                 const expectedId = mockIds[test.expectedIdKey as keyof typeof mockIds];
                 const actualId = scope.jurisdictionIds[test.expectedIdKey as keyof typeof scope.jurisdictionIds];

                 if (actualId === expectedId) {
                     console.log(`PASS: ${test.role} mapped to ${scope.level} (${actualId})`);
                 } else {
                     console.error(`FAIL: ${test.role} ID mismatch. Expected ${expectedId}, got ${actualId}`);
                 }
            } else {
                console.error(`FAIL: ${test.role} mapped to ${scope?.level}, expected ${test.expectedLevel}`);
            }
        }

    } catch (e) {
        console.error("Test Error:", e);
    } finally {
        // Cleanup
        await prisma.beatOfficer.delete({ where: { id: officer.id } });
        await prisma.$disconnect();
    }
}

verify();
