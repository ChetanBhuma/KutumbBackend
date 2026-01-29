"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const citizenController_1 = require("../controllers/citizenController");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const dataScopeMiddleware_1 = require("../middleware/dataScopeMiddleware");
const auth_1 = require("../types/auth");
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const validation_1 = require("../middleware/validation");
const auditMiddleware_1 = require("../middleware/auditMiddleware");
const asyncHandler_1 = require("../middleware/asyncHandler");
const multer_1 = require("../config/multer");
const router = (0, express_1.Router)();
// All routes require authentication and data scope filtering
router.use(authenticate_1.authenticate);
router.use(dataScopeMiddleware_1.dataScopeMiddleware);
/**
 * @swagger
 * /citizens/map:
 *   get:
 *     tags: [Citizens]
 *     summary: Get citizens for map view
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: policeStationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: beatId
 *         schema:
 *           type: string
 *       - in: query
 *         name: districtId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of citizens for map
 */
router.get('/map', (0, authorize_1.requirePermission)(auth_1.Permission.CITIZENS_READ), [
    (0, express_validator_1.query)('policeStationId').optional().trim(),
    (0, express_validator_1.query)('beatId').optional().trim(),
    (0, express_validator_1.query)('districtId').optional().trim(),
    (0, express_validator_1.query)('rangeId').optional().trim(),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(citizenController_1.CitizenController.map));
/**
 * @swagger
 * /citizens:
 *   get:
 *     tags: [Citizens]
 *     summary: Get all citizens with pagination and filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: vulnerabilityLevel
 *         schema:
 *           type: string
 *           enum: [Low, Medium, High]
 *     responses:
 *       200:
 *         description: List of citizens
 *   post:
 *     tags: [Citizens]
 *     summary: Create new citizen
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Citizen'
 *     responses:
 *       201:
 *         description: Citizen created
 */
router.get('/', (0, authorize_1.requirePermission)(auth_1.Permission.CITIZENS_READ), [
    ...validation_1.ValidationRules.pagination(),
    (0, express_validator_1.query)('search').optional().trim(),
    (0, express_validator_1.query)('policeStationId').optional().trim(),
    (0, express_validator_1.query)('beatId').optional().trim(),
    (0, express_validator_1.query)('districtId').optional().trim(),
    (0, express_validator_1.query)('rangeId').optional().trim(),
    (0, express_validator_1.query)('vulnerabilityLevel').optional().isIn(['Low', 'Medium', 'High']),
    (0, express_validator_1.query)('verificationStatus').optional().isIn(['Pending', 'Approved', 'Rejected']),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(citizenController_1.CitizenController.list));
/**
 * @swagger
 * /citizens/statistics:
 *   get:
 *     tags: [Citizens]
 *     summary: Get citizen statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Citizen statistics
 */
router.get('/statistics', (0, authorize_1.requirePermission)(auth_1.Permission.CITIZENS_READ), (0, asyncHandler_1.asyncHandler)(citizenController_1.CitizenController.getStatistics));
/**
 * @swagger
 * /citizens/{id}:
 *   get:
 *     tags: [Citizens]
 *     summary: Get citizen by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Citizen details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Citizen'
 *   put:
 *     tags: [Citizens]
 *     summary: Update citizen
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Citizen'
 *     responses:
 *       200:
 *         description: Citizen updated
 *   delete:
 *     tags: [Citizens]
 *     summary: Delete citizen
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Citizen deleted
 */
router.get('/:id', (0, authorize_1.requirePermission)(auth_1.Permission.CITIZENS_READ), [
    validation_1.ValidationRules.id('id'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(citizenController_1.CitizenController.getById));
router.post('/', (0, authorize_1.requirePermission)(auth_1.Permission.CITIZENS_WRITE), auditMiddleware_1.auditCRUD.create('citizen'), [
    (0, express_validator_1.body)('fullName').trim().isLength({ min: 3, max: 80 }).withMessage('Full name must be 3-80 characters'),
    (0, express_validator_1.body)('dateOfBirth').isISO8601().withMessage('Valid date of birth required'),
    (0, express_validator_1.body)('gender').isIn(['Male', 'Female', 'Other', 'Prefer not to say']).withMessage('Valid gender required'),
    (0, express_validator_1.body)('mobileNumber').matches(/^\+?(91)?[6-9]\d{9}$/).withMessage('Valid Indian mobile number required'),
    (0, express_validator_1.body)('permanentAddress').notEmpty().withMessage('Permanent address required'),
    (0, express_validator_1.body)('pinCode').matches(/^\d{6}$/).withMessage('Valid 6-digit PIN code required'),
    (0, express_validator_1.body)('emergencyContacts').isArray({ min: 1 }).withMessage('At least one emergency contact required'),
    (0, express_validator_1.body)('consentDataUse').equals('true').withMessage('Consent to data use is required'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(citizenController_1.CitizenController.create));
router.put('/:id', (0, authorize_1.requirePermission)(auth_1.Permission.CITIZENS_WRITE), auditMiddleware_1.auditCRUD.update('citizen'), [
    validation_1.ValidationRules.id('id'),
    (0, express_validator_1.body)('fullName').optional().trim().isLength({ min: 3, max: 80 }),
    (0, express_validator_1.body)('dateOfBirth').optional().isISO8601(),
    (0, express_validator_1.body)('gender').optional().isIn(['Male', 'Female', 'Other', 'Prefer not to say']),
    (0, express_validator_1.body)('mobileNumber').optional().matches(/^\+?(91)?[6-9]\d{9}$/),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(citizenController_1.CitizenController.updateProfile));
router.delete('/:id', (0, authorize_1.requirePermission)(auth_1.Permission.CITIZENS_DELETE), auditMiddleware_1.auditCRUD.delete('citizen'), [
    validation_1.ValidationRules.id('id'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(citizenController_1.CitizenController.delete));
/**
 * @swagger
 * /citizens/{id}/verification:
 *   patch:
 *     tags: [Citizens]
 *     summary: Update verification status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Pending, Approved, Rejected]
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/verification', (0, authorize_1.requireRole)([auth_1.Role.ADMIN, auth_1.Role.SUPER_ADMIN]), (0, auditMiddleware_1.auditAction)({ action: 'UPDATE_VERIFICATION_STATUS', resource: 'citizen', includeRequestBody: true }), [
    validation_1.ValidationRules.id('id'),
    (0, express_validator_1.body)('status').isIn(['Pending', 'Approved', 'Rejected']).withMessage('Valid status required'),
    (0, express_validator_1.body)('remarks').optional().trim(),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(citizenController_1.CitizenController.updateVerificationStatus));
/**
 * @swagger
 * /citizens/{id}/digital-card:
 *   post:
 *     tags: [Citizens]
 *     summary: Issue digital card
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Digital card issued
 */
router.post('/:id/digital-card', (0, authorize_1.requireRole)([auth_1.Role.ADMIN, auth_1.Role.SUPER_ADMIN]), (0, auditMiddleware_1.auditAction)({ action: 'ISSUE_DIGITAL_CARD', resource: 'citizen' }), [
    validation_1.ValidationRules.id('id'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(citizenController_1.CitizenController.issueDigitalCard));
/**
 * @swagger
 * /citizens/check-duplicates:
 *   post:
 *     tags: [Citizens]
 *     summary: Check for duplicate citizens
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, mobileNumber]
 *             properties:
 *               fullName:
 *                 type: string
 *               mobileNumber:
 *                 type: string
 *               aadhaarNumber:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Duplicates check result
 */
router.post('/check-duplicates', (0, authorize_1.requirePermission)(auth_1.Permission.CITIZENS_READ), [
    (0, express_validator_1.body)('fullName').trim().notEmpty().withMessage('Full name required'),
    (0, express_validator_1.body)('mobileNumber').matches(/^\+?(91)?[6-9]\d{9}$/).withMessage('Valid mobile number required'),
    (0, express_validator_1.body)('aadhaarNumber').optional().trim(),
    (0, express_validator_1.body)('dateOfBirth').optional().isISO8601(),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(citizenController_1.CitizenController.checkDuplicates));
/**
 * @swagger
 * /citizens/duplicates/all:
 *   get:
 *     tags: [Citizens]
 *     summary: Find all potential duplicates
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of potential duplicates
 */
router.get('/duplicates/all', (0, authorize_1.requireRole)([auth_1.Role.ADMIN, auth_1.Role.SUPER_ADMIN]), (0, asyncHandler_1.asyncHandler)(citizenController_1.CitizenController.findAllDuplicates));
/**
 * @swagger
 * /citizens/{id}/documents:
 *   get:
 *     tags: [Citizens]
 *     summary: Get citizen documents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of documents
 */
router.get('/:id/documents', (0, authorize_1.requirePermission)(auth_1.Permission.CITIZENS_READ), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
    const documents = await prisma.document.findMany({
        where: { seniorCitizenId: id },
        orderBy: { uploadedAt: 'desc' }
    });
    res.json({ success: true, data: { documents } });
}));
/**
 * @swagger
 * /citizens/{id}/documents:
 *   post:
 *     tags: [Citizens]
 *     summary: Upload citizen document
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               documentType:
 *                 type: string
 *                 enum: [ProfilePhoto, AddressProof, IdentityProof, MedicalDocument, Other]
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 */
router.post('/:id/documents', (0, authorize_1.requirePermission)(auth_1.Permission.CITIZENS_WRITE), multer_1.uploadSingle, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { id } = req.params;
        const { documentType } = req.body;
        const file = req.file;
        console.log(`[Upload] Starting upload for citizen ${id}, type: ${documentType}`);
        if (!file) {
            console.error('[Upload] No file received by multer');
            return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
        }
        console.log(`[Upload] File received: ${file.originalname} (${file.size} bytes)`);
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
        const { cloudStorage } = await Promise.resolve().then(() => __importStar(require('../services/cloudStorageService')));
        // Generate file URL using cloud service (handles local/cloud abstraction)
        let fileUrl;
        try {
            fileUrl = await cloudStorage.uploadFile(file.path, `${documentType}/${id}/${file.filename}`, file.mimetype);
            console.log(`[Upload] File processed by storage service: ${fileUrl}`);
        }
        catch (storageError) {
            console.error('[Upload] Storage service error:', storageError);
            return res.status(500).json({ success: false, error: { message: 'Storage service failed', details: storageError } });
        }
        // Create document record
        const document = await prisma.document.create({
            data: {
                seniorCitizenId: id,
                documentType: documentType || 'Other',
                documentName: file.originalname,
                fileUrl: fileUrl,
                fileSize: file.size,
                fileType: file.mimetype,
                uploadedAt: new Date()
            }
        });
        console.log('[Upload] Document record created:', document.id);
        return res.json({ success: true, data: { document } });
    }
    catch (error) {
        console.error('[Upload] Critical error:', error);
        return res.status(500).json({ success: false, error: { message: 'Upload failed', details: error.message } });
    }
}));
/**
 * @swagger
 * /citizens/{id}/documents/{docId}:
 *   delete:
 *     tags: [Citizens]
 *     summary: Delete citizen document
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: docId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document deleted
 */
router.delete('/:id/documents/:docId', (0, authorize_1.requirePermission)(auth_1.Permission.CITIZENS_DELETE), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { docId } = req.params;
    const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
    await prisma.document.delete({ where: { id: docId } });
    res.json({ success: true, message: 'Document deleted successfully' });
}));
exports.default = router;
//# sourceMappingURL=citizenRoutes.js.map