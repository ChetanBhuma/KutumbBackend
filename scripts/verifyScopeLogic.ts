
import { PrismaClient } from '@prisma/client';
import { dataScopeMiddleware, DataScope } from '../src/middleware/dataScopeMiddleware';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

// Mock Express Request
interface MockRequest extends Partial<Request> {
    user?: any;
    query: any;
    dataScope?: DataScope;
}

// Emulate Controller Logic for OfficerController.list (Simplified)
async function getOfficersWithScope(scope: DataScope) {
    const where: any = { isActive: true };

    if (scope && scope.level !== 'ALL') {
        if (scope.level === 'RANGE' && scope.jurisdictionIds.rangeId) {
            where.rangeId = scope.jurisdictionIds.rangeId;
        } else if (scope.level === 'DISTRICT' && scope.jurisdictionIds.districtId) {
            where.districtId = scope.jurisdictionIds.districtId;
        } else if (scope.level === 'SUBDIVISION' && scope.jurisdictionIds.subDivisionId) {
            where.subDivisionId = scope.jurisdictionIds.subDivisionId;
        } else if (scope.level === 'POLICE_STATION' && scope.jurisdictionIds.policeStationId) {
            where.policeStationId = scope.jurisdictionIds.policeStationId;
        } else if (scope.level === 'BEAT' && scope.jurisdictionIds.beatId) {
            where.beatId = scope.jurisdictionIds.beatId;
        }
    }

    // Debug
    // console.log("Where Clause:", where);

    return await prisma.beatOfficer.findMany({ where });
}

async function verifyLogic() {
    console.log("Verifying DataScope Logic...");

    // 1. Fetch our test ACP
    const acp = await prisma.beatOfficer.findFirst({ where: { rank: 'ACP' } });
    if (!acp) throw new Error("Test ACP not found");

    console.log(`Testing with ACP: ${acp.name} (SubDiv: ${acp.subDivisionId})`);

    // Manually construct scope (simulating middleware)
    const acpScope: DataScope = {
        level: 'SUBDIVISION',
        jurisdictionIds: { subDivisionId: acp.subDivisionId! }
    };

    const officersVisibleToACP = await getOfficersWithScope(acpScope);
    console.log(`Officers visible to ACP: ${officersVisibleToACP.length}`);
    officersVisibleToACP.forEach(o => console.log(` - ${o.name} (${o.rank})`));

    // Verify all returned officers are in same subDivision
    const invalid = officersVisibleToACP.find(o => o.subDivisionId !== acp.subDivisionId);
    if (invalid) {
         console.error(`FAILURE: ACP saw officer ${invalid.name} from SubDiv ${invalid.subDivisionId}`);
    } else {
         console.log("SUCCESS: ACP only sees officers in their SubDivision.");
    }

    // 2. Fetch our test Constable
    const constable = await prisma.beatOfficer.findFirst({ where: { rank: 'Constable' } });
    if (!constable) throw new Error("Test Constable not found");

    console.log(`Testing with Constable: ${constable.name} (Beat: ${constable.beatId})`);
     const constableScope: DataScope = {
        level: 'BEAT',
        jurisdictionIds: { beatId: constable.beatId! }
    };

    const officersVisibleToConstable = await getOfficersWithScope(constableScope);
    console.log(`Officers visible to Constable: ${officersVisibleToConstable.length}`);
    officersVisibleToConstable.forEach(o => console.log(` - ${o.name} (${o.rank})`));

     // Verify all returned officers are in same Beat
     // Actually, Officer table doesn't enforce that listed officers are "in the beat" except the officer themselves usually.
     // But wait, if I list officers with Beat Scope, I only see officers assigned to THAT beat.
    const invalidConstable = officersVisibleToConstable.find(o => o.beatId !== constable.beatId);
    if (invalidConstable) {
         console.error(`FAILURE: Constable saw officer ${invalidConstable.name} from Beat ${invalidConstable.beatId}`);
    } else {
         console.log("SUCCESS: Constable only sees officers in their Beat (likely just themselves or partners).");
    }

}

verifyLogic()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
