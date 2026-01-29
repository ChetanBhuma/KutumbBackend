// Public Master Routes - No authentication required
import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// ============================================
// BULK MASTERS ENDPOINT - PUBLIC
// ============================================
router.get('/all', async (_req, res) => {
    try {
        const [ranges, districts, subDivisions, policeStations, beats, livingArrangements, healthConditions, maritalStatuses, visitTypes, designations, riskFactors, systemMasters] = await Promise.all([
            prisma.range.findMany({ where: { isActive: true } }),
            prisma.district.findMany({ where: { isActive: true } }),
            prisma.subDivision.findMany({ where: { isActive: true } }),
            prisma.policeStation.findMany({ where: { isActive: true } }),
            prisma.beat.findMany({ where: { isActive: true } }),
            prisma.livingArrangement.findMany({ where: { isActive: true } }),
            prisma.healthCondition.findMany({ where: { isActive: true } }),
            prisma.maritalStatus.findMany({ where: { isActive: true } }),
            prisma.visitType.findMany({ where: { isActive: true } }),
            prisma.designation.findMany({ where: { isActive: true } }),
            prisma.riskFactor.findMany({ where: { isActive: true } }),
            prisma.systemMaster.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
        ]);

        // Group System Masters by Type
        const systemMastersGrouped = systemMasters.reduce((acc, curr) => {
            if (!acc[curr.type]) acc[curr.type] = [];
            acc[curr.type].push(curr);
            return acc;
        }, {} as Record<string, typeof systemMasters>);

        res.json({
            success: true,
            data: {
                ranges,
                districts,
                subDivisions,
                policeStations,
                beats,
                livingArrangements,
                healthConditions,
                maritalStatuses,
                visitTypes,
                designations,
                riskFactors,
                systemMasters: systemMastersGrouped
            },
        });
    } catch (error) {
        console.error('Failed to fetch bulk masters:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch master data' });
    }
});

// Standalone System Masters
router.get('/system-masters', async (_req, res) => {
    try {
        const masters = await prisma.systemMaster.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' }
        });

        const grouped = masters.reduce((acc, curr) => {
            if (!acc[curr.type]) acc[curr.type] = [];
            acc[curr.type].push(curr);
            return acc;
        }, {} as Record<string, typeof masters>);

        res.json({ success: true, data: grouped });
    } catch (error) {
        console.error('Failed to fetch system masters:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch system masters' });
    }
});

// Individual public endpoints
router.get('/living-arrangements', async (_req, res) => {
    try {
        const data = await prisma.livingArrangement.findMany({ where: { isActive: true } });
        res.json({ success: true, data });
    } catch (error) {
        console.error('Failed to fetch living arrangements:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch living arrangements' });
    }
});

router.get('/health-conditions', async (_req, res) => {
    try {
        const data = await prisma.healthCondition.findMany({ where: { isActive: true } });
        res.json({ success: true, data });
    } catch (error) {
        console.error('Failed to fetch health conditions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch health conditions' });
    }
});

router.get('/districts', async (_req, res) => {
    try {
        const data = await prisma.district.findMany({ where: { isActive: true } });
        res.json({ success: true, data });
    } catch (error) {
        console.error('Failed to fetch districts:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch districts' });
    }
});

router.get('/police-stations', async (_req, res) => {
    try {
        const data = await prisma.policeStation.findMany({ where: { isActive: true } });
        res.json({ success: true, data });
    } catch (error) {
        console.error('Failed to fetch police stations:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch police stations' });
    }
});

// SECURITY: Disabled public beats endpoint to prevent data leakage.
// Roster page now uses authenticated /api/v1/beats
/*
router.get('/beats', async (_req, res) => {
    try {
        const data = await prisma.beat.findMany({ where: { isActive: true } });
        res.json({ success: true, data });
    } catch (error) {
        console.error('Failed to fetch beats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch beats' });
    }
});
*/

router.get('/marital-statuses', async (_req, res) => {
    try {
        const data = await prisma.maritalStatus.findMany({ where: { isActive: true } });
        res.json({ success: true, data });
    } catch (error) {
        console.error('Failed to fetch marital statuses:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch marital statuses' });
    }
});

router.get('/risk-factors', async (_req, res) => {
    try {
        const data = await prisma.riskFactor.findMany({ where: { isActive: true } });
        res.json({ success: true, data });
    } catch (error) {
        console.error('Failed to fetch risk factors:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch risk factors' });
    }
});

export default router;
