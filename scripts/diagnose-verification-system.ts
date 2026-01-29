/**
 * Diagnostic Script: Verification System Health Check
 *
 * This script checks the health of the verification request system by:
 * 1. Checking if citizens have policeStationId assigned
 * 2. Checking if there are active officers in the system
 * 3. Finding VerificationRequests without corresponding Visits
 * 4. Identifying potential auto-assignment failures
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DiagnosticResult {
    timestamp: Date;
    totalCitizens: number;
    citizensWithoutPoliceStation: number;
    citizensInPendingReview: number;
    pendingReviewWithoutStation: number;
    totalOfficers: number;
    activeOfficers: number;
    policeStationsWithOfficers: number;
    policeStationsWithoutOfficers: number;
    totalVerificationRequests: number;
    verificationRequestsWithoutVisits: number;
    pendingVerificationRequests: number;
}

async function runDiagnostics(): Promise<DiagnosticResult> {
    console.log('🔍 Running Verification System Diagnostics...\n');

    // 1. Check Citizens
    console.log('📊 Analyzing Citizens...');
    const totalCitizens = await prisma.seniorCitizen.count();
    const citizensWithoutPoliceStation = await prisma.seniorCitizen.count({
        where: { policeStationId: null }
    });
    const citizensInPendingReview = await prisma.seniorCitizen.count({
        where: { status: 'PENDING_REVIEW' }
    });
    const pendingReviewWithoutStation = await prisma.seniorCitizen.count({
        where: {
            status: 'PENDING_REVIEW',
            policeStationId: null
        }
    });

    console.log(`  ✓ Total Citizens: ${totalCitizens}`);
    console.log(`  ${citizensWithoutPoliceStation > 0 ? '⚠️' : '✓'} Citizens without Police Station: ${citizensWithoutPoliceStation}`);
    console.log(`  ✓ Citizens in PENDING_REVIEW: ${citizensInPendingReview}`);
    console.log(`  ${pendingReviewWithoutStation > 0 ? '⚠️' : '✓'} PENDING_REVIEW without Police Station: ${pendingReviewWithoutStation}\n`);

    // 2. Check Officers
    console.log('👮 Analyzing Officers...');
    const totalOfficers = await prisma.beatOfficer.count();
    const activeOfficers = await prisma.beatOfficer.count({
        where: { isActive: true }
    });

    console.log(`  ✓ Total Officers: ${totalOfficers}`);
    console.log(`  ${activeOfficers === 0 ? '❌' : '✓'} Active Officers: ${activeOfficers}\n`);

    // 3. Check Police Stations with/without Officers
    console.log('🏢 Analyzing Police Stations...');
    const officersByStation = await prisma.beatOfficer.groupBy({
        by: ['policeStationId'],
        where: { isActive: true },
        _count: true
    });

    const allPoliceStations = await prisma.policeStation.findMany({
        select: { id: true, name: true, code: true }
    });

    const stationsWithOfficers = new Set(officersByStation.map(o => o.policeStationId));
    const stationsWithoutOfficers = allPoliceStations.filter(
        station => !stationsWithOfficers.has(station.id)
    );

    console.log(`  ✓ Total Police Stations: ${allPoliceStations.length}`);
    console.log(`  ✓ Stations with Active Officers: ${stationsWithOfficers.size}`);
    console.log(`  ${stationsWithoutOfficers.length > 0 ? '⚠️' : '✓'} Stations without Active Officers: ${stationsWithoutOfficers.length}`);

    if (stationsWithoutOfficers.length > 0 && stationsWithoutOfficers.length <= 5) {
        console.log('    Stations without officers:');
        stationsWithoutOfficers.forEach(station => {
            console.log(`      - ${station.name} (${station.code})`);
        });
    }
    console.log('');

    // 4. Check Verification Requests
    console.log('📋 Analyzing Verification Requests...');
    const totalVerificationRequests = await prisma.verificationRequest.count({
        where: { entityType: 'SeniorCitizen' }
    });

    const pendingVerificationRequests = await prisma.verificationRequest.count({
        where: {
            entityType: 'SeniorCitizen',
            status: 'PENDING'
        }
    });

    // Find VerificationRequests without corresponding Visits
    const verificationRequests = await prisma.verificationRequest.findMany({
        where: { entityType: 'SeniorCitizen' },
        select: {
            id: true,
            seniorCitizenId: true,
            status: true,
            assignedTo: true,
            createdAt: true
        }
    });

    let verificationRequestsWithoutVisits = 0;
    const requestsWithoutVisits: any[] = [];

    for (const request of verificationRequests) {
        const visit = await prisma.visit.findFirst({
            where: {
                seniorCitizenId: request.seniorCitizenId,
                visitType: { equals: 'Verification', mode: 'insensitive' }
            }
        });

        if (!visit) {
            verificationRequestsWithoutVisits++;
            requestsWithoutVisits.push({
                requestId: request.id,
                status: request.status,
                assignedTo: request.assignedTo,
                createdAt: request.createdAt
            });
        }
    }

    console.log(`  ✓ Total Verification Requests: ${totalVerificationRequests}`);
    console.log(`  ${pendingVerificationRequests > 0 ? '⚠️' : '✓'} PENDING Verification Requests: ${pendingVerificationRequests}`);
    console.log(`  ${verificationRequestsWithoutVisits > 0 ? '⚠️' : '✓'} Requests without Visits: ${verificationRequestsWithoutVisits}`);

    if (requestsWithoutVisits.length > 0 && requestsWithoutVisits.length <= 5) {
        console.log('    Recent requests without visits:');
        requestsWithoutVisits.slice(0, 5).forEach(req => {
            console.log(`      - Request ${req.requestId.substring(0, 8)}... (${req.status}) - Created: ${req.createdAt.toISOString()}`);
        });
    }
    console.log('');

    // 5. Check Citizens with VerificationRequests but no policeStationId
    console.log('🔍 Cross-checking Citizens with Verification Requests...');
    const citizensWithRequestsButNoStation = await prisma.seniorCitizen.findMany({
        where: {
            policeStationId: null,
            VerificationRequest: {
                some: {
                    entityType: 'SeniorCitizen'
                }
            }
        },
        select: {
            id: true,
            fullName: true,
            status: true,
            VerificationRequest: {
                select: {
                    id: true,
                    status: true,
                    createdAt: true
                }
            }
        },
        take: 5
    });

    console.log(`  ${citizensWithRequestsButNoStation.length > 0 ? '⚠️' : '✓'} Citizens with Verification Requests but no Police Station: ${citizensWithRequestsButNoStation.length}`);
    if (citizensWithRequestsButNoStation.length > 0) {
        console.log('    Examples:');
        citizensWithRequestsButNoStation.forEach(citizen => {
            console.log(`      - ${citizen.fullName} (${citizen.status}) - ${citizen.VerificationRequest.length} request(s)`);
        });
    }
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 DIAGNOSTIC SUMMARY');
    console.log('═══════════════════════════════════════════════════════');

    const issues: string[] = [];

    if (citizensWithoutPoliceStation > 0) {
        issues.push(`⚠️  ${citizensWithoutPoliceStation} citizens have no police station assigned`);
    }
    if (activeOfficers === 0) {
        issues.push('❌ No active officers in the system');
    }
    if (stationsWithoutOfficers.length > 0) {
        issues.push(`⚠️  ${stationsWithoutOfficers.length} police stations have no active officers`);
    }
    if (verificationRequestsWithoutVisits > 0) {
        issues.push(`⚠️  ${verificationRequestsWithoutVisits} verification requests have no corresponding visits`);
    }
    if (pendingReviewWithoutStation > 0) {
        issues.push(`⚠️  ${pendingReviewWithoutStation} citizens in PENDING_REVIEW have no police station`);
    }

    if (issues.length === 0) {
        console.log('✅ All checks passed! The verification system is healthy.');
    } else {
        console.log('Issues Found:');
        issues.forEach(issue => console.log(`  ${issue}`));
        console.log('\n💡 Recommendations:');
        if (citizensWithoutPoliceStation > 0) {
            console.log('  - Ensure registration form captures policeStationId');
            console.log('  - Consider adding auto-assignment based on pincode/address');
        }
        if (activeOfficers === 0 || stationsWithoutOfficers.length > 0) {
            console.log('  - Add active officers to police stations');
            console.log('  - Run seed scripts to populate officer data');
        }
        if (verificationRequestsWithoutVisits > 0) {
            console.log('  - Review audit logs for auto-assignment failures');
            console.log('  - Manually assign pending verification requests');
        }
    }
    console.log('═══════════════════════════════════════════════════════\n');

    return {
        timestamp: new Date(),
        totalCitizens,
        citizensWithoutPoliceStation,
        citizensInPendingReview,
        pendingReviewWithoutStation,
        totalOfficers,
        activeOfficers,
        policeStationsWithOfficers: stationsWithOfficers.size,
        policeStationsWithoutOfficers: stationsWithoutOfficers.length,
        totalVerificationRequests,
        verificationRequestsWithoutVisits,
        pendingVerificationRequests
    };
}

// Run diagnostics
runDiagnostics()
    .then(result => {
        console.log('✅ Diagnostics completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Diagnostics failed:', error);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });
