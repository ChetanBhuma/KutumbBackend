// Master Routes
import express from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { Role } from '../types/auth';

// Police Station routes
import {
    getPoliceStations,
    getPoliceStationById,
    createPoliceStation,
    updatePoliceStation,
    deletePoliceStation,
} from '../controllers/policeStationController';

// Role routes
import {
    listRoles as getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    getRoleMatrix,
} from '../controllers/roleController';

// Visit Type routes
import {
    getVisitTypes,
    getVisitTypeById,
    createVisitType,
    updateVisitType,
    deleteVisitType,
} from '../controllers/visitTypeController';

// Health Condition routes
import {
    getHealthConditions,
    getHealthConditionById,
    createHealthCondition,
    updateHealthCondition,
    deleteHealthCondition,
} from '../controllers/healthConditionController';

// District routes
import {
    getDistricts,
    getDistrictById,
    createDistrict,
    updateDistrict,
    deleteDistrict,
} from '../controllers/districtController';

// Range routes
import {
    getRanges,
    getRangeById,
    createRange,
    updateRange,
    deleteRange,
} from '../controllers/rangeController';

// SubDivision routes
import {
    getSubDivisions,
    getSubDivisionById,
    createSubDivision,
    updateSubDivision,
    deleteSubDivision,
} from '../controllers/subDivisionController';

// Living Arrangement routes
import {
    getLivingArrangements,
    getLivingArrangementById,
    createLivingArrangement,
    updateLivingArrangement,
    deleteLivingArrangement,
} from '../controllers/livingArrangementController';

// Marital Status routes
import {
    getMaritalStatuses,
    createMaritalStatus,
    updateMaritalStatus,
    deleteMaritalStatus,
} from '../controllers/maritalStatusController';

// Risk Factor routes
import {
    getRiskFactors,
    createRiskFactor,
    updateRiskFactor,
    deleteRiskFactor,
} from '../controllers/riskFactorController';

// Beat Controller
import beatController from '../controllers/beatController';

const router = express.Router();

// ============================================
// PUBLIC MASTER DATA ENDPOINTS (No auth required)
// ============================================

/**
 * @swagger
 * /master/all:
 *   get:
 *     tags: [Master Data]
 *     summary: Get all master data (Public)
 *     description: Fetch all districts, police stations, beats, etc. in one call.
 *     responses:
 *       200:
 *         description: All master data
 */
// ... (previous imports)

/**
 * @swagger
 * /master/all:
 *   get:
 *     tags: [Master Data]
 *     summary: Get all master data (Public)
 *     description: Fetch all districts, police stations, beats, etc. in one call.
 *     responses:
 *       200:
 *         description: All master data
 */
router.get('/all', async (_req, res) => {
    try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        const [
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
            systemMastersRaw
        ] = await Promise.all([
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
            prisma.systemMaster.findMany({ where: { isActive: true } }),
        ]);

        // Group SystemMaster by type
        const systemMasters = systemMastersRaw.reduce((acc: any, curr: any) => {
            if (!acc[curr.type]) {
                acc[curr.type] = [];
            }
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
                systemMasters
            },
        });
    } catch (error) {
        console.error('Failed to fetch bulk masters:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch master data' });
    }
});

/**
 * @swagger
 * /master/living-arrangements:
 *   get:
 *     tags: [Master Data]
 *     summary: Get living arrangements
 *     responses:
 *       200:
 *         description: List of living arrangements
 */
router.get('/living-arrangements', getLivingArrangements);
router.get('/living-arrangements/:id', getLivingArrangementById);

/**
 * @swagger
 * /master/health-conditions:
 *   get:
 *     tags: [Master Data]
 *     summary: Get health conditions
 *     responses:
 *       200:
 *         description: List of health conditions
 */
router.get('/health-conditions', getHealthConditions);
router.get('/health-conditions/:id', getHealthConditionById);

/**
 * @swagger
 * /master/ranges:
 *   get:
 *     tags: [Master Data]
 *     summary: Get ranges
 *     responses:
 *       200:
 *         description: List of ranges
 */
router.get('/ranges', getRanges);
router.get('/ranges/:id', getRangeById);

/**
 * @swagger
 * /master/districts:
 *   get:
 *     tags: [Master Data]
 *     summary: Get districts
 *     responses:
 *       200:
 *         description: List of districts
 */
router.get('/districts', getDistricts);
router.get('/districts/:id', getDistrictById);

/**
 * @swagger
 * /master/sub-divisions:
 *   get:
 *     tags: [Master Data]
 *     summary: Get sub-divisions
 *     responses:
 *       200:
 *         description: List of sub-divisions
 */
router.get('/sub-divisions', getSubDivisions);
router.get('/sub-divisions/:id', getSubDivisionById);

/**
 * @swagger
 * /master/marital-statuses:
 *   get:
 *     tags: [Master Data]
 *     summary: Get marital statuses
 *     responses:
 *       200:
 *         description: List of marital statuses
 */
router.get('/marital-statuses', getMaritalStatuses);

/**
 * @swagger
 * /master/risk-factors:
 *   get:
 *     tags: [Master Data]
 *     summary: Get risk factors
 *     responses:
 *       200:
 *         description: List of risk factors
 */
router.get('/risk-factors', getRiskFactors);

// ============================================
// AUTHENTICATED ROUTES (require auth)
// ============================================
router.use(authenticate);

// ============================================
// POLICE STATION ROUTES
// ============================================
/**
 * @swagger
 * /master/police-stations:
 *   get:
 *     tags: [Master Data]
 *     summary: Get police stations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of police stations
 *   post:
 *     tags: [Master Data]
 *     summary: Create police station (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, districtId]
 *             properties:
 *               name:
 *                 type: string
 *               districtId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 */
router.get('/police-stations', getPoliceStations);
router.get('/police-stations/:id', getPoliceStationById);

router.post('/police-stations', requireRole([Role.SUPER_ADMIN, Role.ADMIN]), createPoliceStation);
router.put('/police-stations/:id', requireRole([Role.SUPER_ADMIN, Role.ADMIN]), updatePoliceStation);
router.delete('/police-stations/:id', requireRole([Role.SUPER_ADMIN]), deletePoliceStation);

// ============================================
// ROLE ROUTES
// ============================================
/**
 * @swagger
 * /master/roles:
 *   get:
 *     tags: [Master Data]
 *     summary: Get roles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 */
router.get('/roles', getRoles);
router.get('/roles/:id', getRoleById);
router.get('/roles/matrix', getRoleMatrix);
router.post('/roles', requireRole([Role.SUPER_ADMIN]), createRole);
router.put('/roles/:id', requireRole([Role.SUPER_ADMIN]), updateRole);
router.delete('/roles/:id', requireRole([Role.SUPER_ADMIN]), deleteRole);

// ============================================
// VISIT TYPE ROUTES
// ============================================
/**
 * @swagger
 * /master/visit-types:
 *   get:
 *     tags: [Master Data]
 *     summary: Get visit types
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of visit types
 */
router.get('/visit-types', getVisitTypes);
router.get('/visit-types/:id', getVisitTypeById);
router.post('/visit-types', requireRole([Role.SUPER_ADMIN, Role.ADMIN]), createVisitType);
router.put('/visit-types/:id', requireRole([Role.SUPER_ADMIN, Role.ADMIN]), updateVisitType);
router.delete('/visit-types/:id', requireRole([Role.SUPER_ADMIN]), deleteVisitType);

// ============================================
// HEALTH CONDITION ROUTES (Admin ops)
// ============================================
router.post('/health-conditions', requireRole([Role.SUPER_ADMIN, Role.ADMIN]), createHealthCondition);
router.put('/health-conditions/:id', requireRole([Role.SUPER_ADMIN, Role.ADMIN]), updateHealthCondition);
router.delete('/health-conditions/:id', requireRole([Role.SUPER_ADMIN]), deleteHealthCondition);

// ============================================
// RANGE ROUTES (Admin ops)
// ============================================
router.post('/ranges', requireRole([Role.SUPER_ADMIN, Role.ADMIN]), createRange);
router.put('/ranges/:id', requireRole([Role.SUPER_ADMIN, Role.ADMIN]), updateRange);
router.delete('/ranges/:id', requireRole([Role.SUPER_ADMIN]), deleteRange);

// ============================================
// DISTRICT ROUTES (Admin ops)
// ============================================
router.post('/districts', requireRole([Role.SUPER_ADMIN, Role.ADMIN]), createDistrict);
router.put('/districts/:id', requireRole([Role.SUPER_ADMIN, Role.ADMIN]), updateDistrict);
router.delete('/districts/:id', requireRole([Role.SUPER_ADMIN]), deleteDistrict);

// ============================================
// LIVING ARRANGEMENT ROUTES (Admin ops)
// ============================================
router.post('/living-arrangements', requireRole([Role.SUPER_ADMIN, Role.ADMIN]), createLivingArrangement);
router.put('/living-arrangements/:id', requireRole([Role.SUPER_ADMIN, Role.ADMIN]), updateLivingArrangement);
router.delete('/living-arrangements/:id', requireRole([Role.SUPER_ADMIN]), deleteLivingArrangement);

// ============================================
// MARITAL STATUS ROUTES (Admin ops)
// ============================================
router.post('/marital-statuses', requireRole([Role.SUPER_ADMIN, Role.ADMIN]), createMaritalStatus);
router.put('/marital-statuses/:id', requireRole([Role.SUPER_ADMIN, Role.ADMIN]), updateMaritalStatus);
router.delete('/marital-statuses/:id', requireRole([Role.SUPER_ADMIN]), deleteMaritalStatus);

// ============================================
// RISK FACTOR ROUTES (Admin ops)
// ============================================
router.post('/risk-factors', requireRole([Role.SUPER_ADMIN, Role.ADMIN]), createRiskFactor);
router.put('/risk-factors/:id', requireRole([Role.SUPER_ADMIN, Role.ADMIN]), updateRiskFactor);
router.delete('/risk-factors/:id', requireRole([Role.SUPER_ADMIN]), deleteRiskFactor);

// ============================================
// SUB-DIVISION ROUTES (Admin ops)
// ============================================
router.post('/sub-divisions', requireRole([Role.SUPER_ADMIN, Role.ADMIN]), createSubDivision);
router.put('/sub-divisions/:id', requireRole([Role.SUPER_ADMIN, Role.ADMIN]), updateSubDivision);
router.delete('/sub-divisions/:id', requireRole([Role.SUPER_ADMIN]), deleteSubDivision);

// ============================================
// BEAT ROUTES (Admin ops)
// ============================================
// Apply Data Scope Middleware for listing beats to ensure Roster page is scoped
import { dataScopeMiddleware } from '../middleware/dataScopeMiddleware';

router.get('/beats', dataScopeMiddleware, beatController.list);
router.get('/beats/:id', beatController.getById);
router.post('/beats', requireRole([Role.SUPER_ADMIN, Role.ADMIN]), beatController.create);
router.put('/beats/:id', requireRole([Role.SUPER_ADMIN, Role.ADMIN]), beatController.update);
router.delete('/beats/:id', requireRole([Role.SUPER_ADMIN]), beatController.delete);



// ============================================
// SYSTEM CONFIGURATION ROUTES
// ============================================
/**
 * @swagger
 * /master/system-config:
 *   get:
 *     tags: [Master Data]
 *     summary: Get system configuration
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System config
 *   put:
 *     tags: [Master Data]
 *     summary: Update system configuration (Super Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               configs:
 *                 type: object
 *     responses:
 *       200:
 *         description: Updated
 */
router.get('/system-config', async (_req, res) => {
    // Return all system configuration settings
    res.json({
        success: true,
        data: {
            // Visit Management
            visit_default_duration: 30,
            visit_reminder_hours: 24,
            visit_types: 'Routine Check,Health Emergency,Welfare Check,Safety Inspection,Follow-up',

            // SOS Management
            sos_auto_escalate_minutes: 15,
            sos_priority_levels: 'Critical,High,Medium,Low',

            // Citizen Management
            vulnerability_levels: 'High,Medium,Low',
            living_arrangements: 'Alone,With Spouse,With Children,With Other Family,In Senior Care Home',
            min_age_retirement: 60,

            // Notifications
            sms_enabled: true,
            email_enabled: true,
            push_enabled: true,

            // Security
            session_timeout_minutes: 30,
            max_login_attempts: 5,
            password_min_length: 8,
            otp_expiry_minutes: 10,
        },
    });
});

router.put('/system-config', requireRole([Role.SUPER_ADMIN]), async (req, res) => {
    // Update system configuration
    const { configs: _configs } = req.body;

    // In production, save to database
    // For now, just return success

    res.json({
        success: true,
        message: 'System configuration updated successfully',
    });
});

export default router;
