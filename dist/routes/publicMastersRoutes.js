"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Public Master Routes - No authentication required
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
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
            if (!acc[curr.type])
                acc[curr.type] = [];
            acc[curr.type].push(curr);
            return acc;
        }, {});
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
    }
    catch (error) {
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
            if (!acc[curr.type])
                acc[curr.type] = [];
            acc[curr.type].push(curr);
            return acc;
        }, {});
        res.json({ success: true, data: grouped });
    }
    catch (error) {
        console.error('Failed to fetch system masters:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch system masters' });
    }
});
// Individual public endpoints
router.get('/living-arrangements', async (_req, res) => {
    try {
        const data = await prisma.livingArrangement.findMany({ where: { isActive: true } });
        res.json({ success: true, data });
    }
    catch (error) {
        console.error('Failed to fetch living arrangements:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch living arrangements' });
    }
});
router.get('/health-conditions', async (_req, res) => {
    try {
        const data = await prisma.healthCondition.findMany({ where: { isActive: true } });
        res.json({ success: true, data });
    }
    catch (error) {
        console.error('Failed to fetch health conditions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch health conditions' });
    }
});
router.get('/districts', async (_req, res) => {
    try {
        const data = await prisma.district.findMany({ where: { isActive: true } });
        res.json({ success: true, data });
    }
    catch (error) {
        console.error('Failed to fetch districts:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch districts' });
    }
});
router.get('/police-stations', async (_req, res) => {
    try {
        const data = await prisma.policeStation.findMany({ where: { isActive: true } });
        res.json({ success: true, data });
    }
    catch (error) {
        console.error('Failed to fetch police stations:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch police stations' });
    }
});
router.get('/beats', async (_req, res) => {
    try {
        const data = await prisma.beat.findMany({ where: { isActive: true } });
        res.json({ success: true, data });
    }
    catch (error) {
        console.error('Failed to fetch beats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch beats' });
    }
});
router.get('/marital-statuses', async (_req, res) => {
    try {
        const data = await prisma.maritalStatus.findMany({ where: { isActive: true } });
        res.json({ success: true, data });
    }
    catch (error) {
        console.error('Failed to fetch marital statuses:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch marital statuses' });
    }
});
router.get('/risk-factors', async (_req, res) => {
    try {
        const data = await prisma.riskFactor.findMany({ where: { isActive: true } });
        res.json({ success: true, data });
    }
    catch (error) {
        console.error('Failed to fetch risk factors:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch risk factors' });
    }
});
exports.default = router;
//# sourceMappingURL=publicMastersRoutes.js.map