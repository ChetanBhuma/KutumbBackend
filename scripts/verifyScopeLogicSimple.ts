
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define locally to avoid import issues
interface DataScope {
    level: 'ALL' | 'RANGE' | 'DISTRICT' | 'SUBDIVISION' | 'POLICE_STATION' | 'BEAT';
    jurisdictionIds: {
        rangeId?: string;
        districtId?: string;
        subDivisionId?: string;
        policeStationId?: string;
        beatId?: string;
    };
}

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

    return await prisma.beatOfficer.findMany({ where });
}

async function verifyLogic() {
    console.log("Verifying DataScope Logic (Simplified Script)...");

    const acp = await prisma.beatOfficer.findFirst({ where: { rank: 'ACP' } });
    if (!acp) {
        console.log("No ACP found. Skipping ACP test.");
    } else {
        console.log(`Testing with ACP: ${acp.name} (SubDiv: ${acp.subDivisionId})`);
        const acpScope: DataScope = {
            level: 'SUBDIVISION',
            jurisdictionIds: { subDivisionId: acp.subDivisionId! }
        };

        const officersVisibleToACP = await getOfficersWithScope(acpScope);
        console.log(`Officers visible to ACP: ${officersVisibleToACP.length}`);

        const invalid = officersVisibleToACP.find(o => o.subDivisionId !== acp.subDivisionId);
        if (invalid) {
             console.error(`FAILURE: ACP saw officer ${invalid.name} from SubDiv ${invalid.subDivisionId}`);
        } else {
             console.log("SUCCESS: ACP only sees officers in their SubDivision.");
        }
    }

    const constable = await prisma.beatOfficer.findFirst({ where: { rank: 'Constable' } });
    if (!constable) {
         console.log("No Constable found. Skipping Constable test.");
    } else {
        console.log(`Testing with Constable: ${constable.name} (Beat: ${constable.beatId})`);
        const constableScope: DataScope = {
            level: 'BEAT',
            jurisdictionIds: { beatId: constable.beatId! }
        };

        const officersVisibleToConstable = await getOfficersWithScope(constableScope);
        console.log(`Officers visible to Constable: ${officersVisibleToConstable.length}`);

        const invalidConstable = officersVisibleToConstable.find(o => o.beatId !== constable.beatId);
        if (invalidConstable) {
             console.error(`FAILURE: Constable saw officer ${invalidConstable.name} from Beat ${invalidConstable.beatId}`);
        } else {
             console.log("SUCCESS: Constable only sees officers in their Beat.");
        }
    }
}

verifyLogic()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
