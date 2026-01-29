
import { prisma } from '../config/database';
import { TokenService } from '../services/tokenService';

const TARGET_EMAIL = 'shouttamnagar@gmail.com';

async function printToken() {
    const user = await prisma.user.findUnique({
        where: { email: TARGET_EMAIL },
        include: { officerProfile: { include: { PoliceStation: true } } }
    });

    if (!user) {
        console.error('User not found');
        return;
    }

    const token = TokenService.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        officerId: user.officerId
    });

    console.log(`STATION_ID:${user.officerProfile?.policeStationId}`);
    console.log(`TOKEN:${token}`);
}

printToken().catch(console.error).finally(() => prisma.$disconnect());
