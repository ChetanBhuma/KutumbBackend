import prisma from '../src/config/prisma';

async function verifyUserCreation() {
    try {
        console.log("Starting verification...");

        const email = `test.acp.${Date.now()}@delhipolice.gov.in`;
        const phone = `9${Date.now().toString().slice(0, 9)}`;
        const roleCode = 'ACP';

        // Mock a subdivision ID (fetching first available)
        const subDivision = await prisma.subDivision.findFirst();
        if (!subDivision) {
            console.error("No SubDivision found to test with.");
            return;
        }

        console.log(`Creating user with email: ${email}, Role: ${roleCode}, SubDivision: ${subDivision.id}`);

        // Simulate Controller Logic (We can't call controller directly easily without mocking Req/Res, so we replicate logic or use a helper if extracted, but better to fetch the newly updated controller code? No, I will replicate the fetch logic briefly or use fetch if app is running.
        // Since app might be running, I can try `fetch`. But I don't know if server is up or restarted.
        // Actually, I can just call the transaction logic directly here to ensure Prisma schema and logic works.
        // But verifying compilation of controller typescript is better done by simpler means.

        // Let's just create using prisma logical flow exactly as written in controller to catch type errors.

        const juris = { subDivisionId: subDivision.id };
        const name = "Test ACP User";
        const badgeNumber = `ACP-${Date.now()}`;

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    phone,
                    passwordHash: 'hashedpassword',
                    role: roleCode,
                    isActive: true,
                },
            });

            console.log("User created:", user.id);

            const officer = await tx.beatOfficer.create({
                 data: {
                     name,
                     rank: roleCode,
                     badgeNumber,
                     mobileNumber: phone,
                     email: email,
                     subDivisionId: juris.subDivisionId,
                     user: {
                         connect: { id: user.id }
                     }
                 }
            });
            console.log("Officer created:", officer.id);

            await tx.user.update({
                 where: { id: user.id },
                 data: { officerId: officer.id }
            });

            return { user, officer };
        });

        console.log("SUCCESS: Created User linked with Officer:", result.user.id, result.officer.id);

        // Check if officer has correct subdivision
        const checkOfficer = await prisma.beatOfficer.findUnique({ where: { id: result.officer.id } });
        if (checkOfficer?.subDivisionId === subDivision.id) {
            console.log("SUCCESS: Jurisdiction mapped correctly.");
        } else {
            console.error("FAILURE: Jurisdiction mismatch.");
        }

    } catch (error) {
        console.error("Verification Failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyUserCreation();
