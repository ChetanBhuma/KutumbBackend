import { prisma } from '../config/database';


/**
 * Cleanup job to purge stale 'Unknown' citizen records
 * This is a safety net for failed or abandoned registrations.
 * Older than 24 hours.
 */
export const cleanupStaleRegistrations = async () => {
    try {
        const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

        const staleCitizens = await prisma.seniorCitizen.findMany({
            where: {
                fullName: 'Unknown',
                createdAt: {
                    lt: cutoffDate
                },
                // Ensure we don't delete citizens that are actually linked to valid registrations that are just incomplete?
                // Or maybe check idVerificationStatus is Pending/Placeholder
                idVerificationStatus: 'Pending'
            },
            select: { id: true, mobileNumber: true }
        });

        if (staleCitizens.length === 0) {
            console.log('No stale registrations found.');
            return;
        }

        console.log(`Found ${staleCitizens.length} stale registrations. Purging...`);

        // Transactional delete? Or just bulk delete.
        // We might need to delete linked Auth/Registration first if cascading isn't set up, 
        // but typically we want to keep registration history but maybe unlink citizen.
        // Actually, if it's "Unknown", it's junk.

        // Let's delete them.
        for (const citizen of staleCitizens) {
            try {
                // Check if any active visits exist (unlikely for "Unknown")
                const activeVisits = await prisma.visit.count({
                    where: { seniorCitizenId: citizen.id }
                });

                if (activeVisits > 0) {
                    console.warn(`Skipping citizen ${citizen.id} (${citizen.mobileNumber}) as they have visits.`);
                    continue;
                }

                // Delete linked Auth if it exists and is not verified? 
                // Using transaction for safety
                await prisma.$transaction(async (tx) => {
                    // Update Registration to remove link or set to expired
                    await tx.citizenRegistration.updateMany({
                        where: { citizenId: citizen.id },
                        data: { citizenId: null, status: 'REJECTED' } // soft unlink
                    });

                    // Unlink Auth
                    await tx.citizenAuth.updateMany({
                        where: { citizenId: citizen.id },
                        data: { citizenId: null }
                    });

                    // Now delete citizen
                    await tx.seniorCitizen.delete({
                        where: { id: citizen.id }
                    });
                });

                console.log(`Purged citizen ${citizen.id}`);
            } catch (err) {
                console.error(`Failed to purge citizen ${citizen.id}:`, err);
            }
        }

    } catch (error) {
        console.error('Error in cleanup job:', error);
    }
};

// Run if called directly
if (require.main === module) {
    cleanupStaleRegistrations()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
