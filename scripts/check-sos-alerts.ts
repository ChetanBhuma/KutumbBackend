import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSOSAlerts() {
    try {
        console.log('🔍 Checking SOS Alerts in Database...\n');

        // Get all SOS alerts
        const allAlerts = await prisma.sOSAlert.findMany({
            include: {
                SeniorCitizen: {
                    select: {
                        id: true,
                        fullName: true,
                        mobileNumber: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`📊 Total SOS Alerts: ${allAlerts.length}\n`);

        if (allAlerts.length === 0) {
            console.log('❌ No SOS alerts found in database!\n');
            console.log('💡 To test:');
            console.log('   1. Login as citizen (9090009090 / Test@123)');
            console.log('   2. Go to http://localhost:3000/citizen-portal/sos');
            console.log('   3. Click "Trigger SOS Alert"\n');
        } else {
            console.log('✅ SOS Alerts Found:\n');

            allAlerts.forEach((alert, index) => {
                console.log(`${index + 1}. Alert ID: ${alert.id}`);
                console.log(`   Citizen: ${alert.SeniorCitizen?.fullName || 'Unknown'}`);
                console.log(`   Phone: ${alert.SeniorCitizen?.mobileNumber || 'N/A'}`);
                console.log(`   Status: ${alert.status}`);
                console.log(`   Location: ${alert.latitude}, ${alert.longitude}`);
                console.log(`   Created: ${alert.createdAt.toLocaleString()}`);
                console.log(`   Address: ${alert.address || 'Not provided'}\n`);
            });

            // Check active alerts
            const activeAlerts = allAlerts.filter(a => a.status === 'Active' || a.status === 'Responded');
            console.log(`\n🚨 Active/Responded Alerts: ${activeAlerts.length}`);

            if (activeAlerts.length === 0) {
                console.log('   All alerts have been resolved or marked as false alarm.');
                console.log('   Create a new alert to see it in the admin dashboard.\n');
            }
        }

        // Check if Test Citizen exists
        console.log('\n👤 Checking Test Citizen...\n');
        const testCitizen = await prisma.seniorCitizen.findFirst({
            where: {
                OR: [
                    { fullName: { contains: 'Test Citizen', mode: 'insensitive' } },
                    { mobileNumber: '9090009090' }
                ]
            },
            include: {
                PoliceStation: true,
                Beat: {
                    include: {
                        BeatOfficer: {
                            where: { isActive: true }
                        }
                    }
                }
            }
        });

        if (testCitizen) {
            console.log('✅ Test Citizen Found:');
            console.log(`   Name: ${testCitizen.fullName}`);
            console.log(`   Mobile: ${testCitizen.mobileNumber}`);
            console.log(`   Police Station: ${testCitizen.PoliceStation?.name || 'Not assigned'}`);
            console.log(`   Beat: ${testCitizen.Beat?.name || 'Not assigned'}`);
            console.log(`   Officers in Beat: ${testCitizen.Beat?.BeatOfficer?.length || 0}\n`);
        } else {
            console.log('❌ Test Citizen not found!\n');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSOSAlerts()
    .then(() => {
        console.log('✨ Check completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
