"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Master Routes
const express_1 = __importDefault(require("express"));
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const auth_1 = require("../types/auth");
// Police Station routes
const policeStationController_1 = require("../controllers/policeStationController");
// Role routes
const roleController_1 = require("../controllers/roleController");
// Visit Type routes
const visitTypeController_1 = require("../controllers/visitTypeController");
// Health Condition routes
const healthConditionController_1 = require("../controllers/healthConditionController");
// District routes
const districtController_1 = require("../controllers/districtController");
// Range routes
const rangeController_1 = require("../controllers/rangeController");
// SubDivision routes
const subDivisionController_1 = require("../controllers/subDivisionController");
// Living Arrangement routes
const livingArrangementController_1 = require("../controllers/livingArrangementController");
// Marital Status routes
const maritalStatusController_1 = require("../controllers/maritalStatusController");
// Risk Factor routes
const riskFactorController_1 = require("../controllers/riskFactorController");
// Beat Controller
const beatController_1 = __importDefault(require("../controllers/beatController"));
const router = express_1.default.Router();
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
        const [ranges, districts, subDivisions, policeStations, beats, livingArrangements, healthConditions, maritalStatuses, visitTypes, designations, riskFactors, systemMastersRaw] = await Promise.all([
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
        const systemMasters = systemMastersRaw.reduce((acc, curr) => {
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
    }
    catch (error) {
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
router.get('/living-arrangements', livingArrangementController_1.getLivingArrangements);
router.get('/living-arrangements/:id', livingArrangementController_1.getLivingArrangementById);
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
router.get('/health-conditions', healthConditionController_1.getHealthConditions);
router.get('/health-conditions/:id', healthConditionController_1.getHealthConditionById);
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
router.get('/ranges', rangeController_1.getRanges);
router.get('/ranges/:id', rangeController_1.getRangeById);
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
router.get('/districts', districtController_1.getDistricts);
router.get('/districts/:id', districtController_1.getDistrictById);
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
router.get('/sub-divisions', subDivisionController_1.getSubDivisions);
router.get('/sub-divisions/:id', subDivisionController_1.getSubDivisionById);
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
router.get('/marital-statuses', maritalStatusController_1.getMaritalStatuses);
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
router.get('/risk-factors', riskFactorController_1.getRiskFactors);
// ============================================
// AUTHENTICATED ROUTES (require auth)
// ============================================
router.use(authenticate_1.authenticate);
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
router.get('/police-stations', policeStationController_1.getPoliceStations);
router.get('/police-stations/:id', policeStationController_1.getPoliceStationById);
router.post('/police-stations', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN, auth_1.Role.ADMIN]), policeStationController_1.createPoliceStation);
router.put('/police-stations/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN, auth_1.Role.ADMIN]), policeStationController_1.updatePoliceStation);
router.delete('/police-stations/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN]), policeStationController_1.deletePoliceStation);
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
router.get('/roles', roleController_1.listRoles);
router.get('/roles/:id', roleController_1.getRoleById);
router.get('/roles/matrix', roleController_1.getRoleMatrix);
router.post('/roles', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN]), roleController_1.createRole);
router.put('/roles/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN]), roleController_1.updateRole);
router.delete('/roles/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN]), roleController_1.deleteRole);
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
router.get('/visit-types', visitTypeController_1.getVisitTypes);
router.get('/visit-types/:id', visitTypeController_1.getVisitTypeById);
router.post('/visit-types', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN, auth_1.Role.ADMIN]), visitTypeController_1.createVisitType);
router.put('/visit-types/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN, auth_1.Role.ADMIN]), visitTypeController_1.updateVisitType);
router.delete('/visit-types/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN]), visitTypeController_1.deleteVisitType);
// ============================================
// HEALTH CONDITION ROUTES (Admin ops)
// ============================================
router.post('/health-conditions', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN, auth_1.Role.ADMIN]), healthConditionController_1.createHealthCondition);
router.put('/health-conditions/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN, auth_1.Role.ADMIN]), healthConditionController_1.updateHealthCondition);
router.delete('/health-conditions/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN]), healthConditionController_1.deleteHealthCondition);
// ============================================
// RANGE ROUTES (Admin ops)
// ============================================
router.post('/ranges', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN, auth_1.Role.ADMIN]), rangeController_1.createRange);
router.put('/ranges/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN, auth_1.Role.ADMIN]), rangeController_1.updateRange);
router.delete('/ranges/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN]), rangeController_1.deleteRange);
// ============================================
// DISTRICT ROUTES (Admin ops)
// ============================================
router.post('/districts', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN, auth_1.Role.ADMIN]), districtController_1.createDistrict);
router.put('/districts/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN, auth_1.Role.ADMIN]), districtController_1.updateDistrict);
router.delete('/districts/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN]), districtController_1.deleteDistrict);
// ============================================
// LIVING ARRANGEMENT ROUTES (Admin ops)
// ============================================
router.post('/living-arrangements', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN, auth_1.Role.ADMIN]), livingArrangementController_1.createLivingArrangement);
router.put('/living-arrangements/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN, auth_1.Role.ADMIN]), livingArrangementController_1.updateLivingArrangement);
router.delete('/living-arrangements/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN]), livingArrangementController_1.deleteLivingArrangement);
// ============================================
// MARITAL STATUS ROUTES (Admin ops)
// ============================================
router.post('/marital-statuses', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN, auth_1.Role.ADMIN]), maritalStatusController_1.createMaritalStatus);
router.put('/marital-statuses/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN, auth_1.Role.ADMIN]), maritalStatusController_1.updateMaritalStatus);
router.delete('/marital-statuses/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN]), maritalStatusController_1.deleteMaritalStatus);
// ============================================
// RISK FACTOR ROUTES (Admin ops)
// ============================================
router.post('/risk-factors', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN, auth_1.Role.ADMIN]), riskFactorController_1.createRiskFactor);
router.put('/risk-factors/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN, auth_1.Role.ADMIN]), riskFactorController_1.updateRiskFactor);
router.delete('/risk-factors/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN]), riskFactorController_1.deleteRiskFactor);
// ============================================
// SUB-DIVISION ROUTES (Admin ops)
// ============================================
router.post('/sub-divisions', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN, auth_1.Role.ADMIN]), subDivisionController_1.createSubDivision);
router.put('/sub-divisions/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN, auth_1.Role.ADMIN]), subDivisionController_1.updateSubDivision);
router.delete('/sub-divisions/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN]), subDivisionController_1.deleteSubDivision);
// ============================================
// BEAT ROUTES (Admin ops)
// ============================================
// Apply Data Scope Middleware for listing beats to ensure Roster page is scoped
const dataScopeMiddleware_1 = require("../middleware/dataScopeMiddleware");
router.get('/beats', dataScopeMiddleware_1.dataScopeMiddleware, beatController_1.default.list);
router.get('/beats/:id', beatController_1.default.getById);
router.post('/beats', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN, auth_1.Role.ADMIN]), beatController_1.default.create);
router.put('/beats/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN, auth_1.Role.ADMIN]), beatController_1.default.update);
router.delete('/beats/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN]), beatController_1.default.delete);
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
router.put('/system-config', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN]), async (req, res) => {
    // Update system configuration
    const { configs: _configs } = req.body;
    // In production, save to database
    // For now, just return success
    res.json({
        success: true,
        message: 'System configuration updated successfully',
    });
});
exports.default = router;
//# sourceMappingURL=masterRoutes.js.map