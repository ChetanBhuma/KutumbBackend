import { Router } from 'express';
import { CitizenController } from '../controllers/citizenController';
import { authenticate } from '../middleware/authenticate';
import { requirePermission, requireRole } from '../middleware/authorize';
import { dataScopeMiddleware } from '../middleware/dataScopeMiddleware';
import { Permission, Role } from '../types/auth';
import { body, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { ValidationRules } from '../middleware/validation';
import { auditCRUD, auditAction } from '../middleware/auditMiddleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { uploadSingle } from '../config/multer';

const router = Router();

// All routes require authentication and data scope filtering
router.use(authenticate);
router.use(dataScopeMiddleware);

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
router.get(
    '/map',
    requirePermission(Permission.CITIZENS_READ),
    [
        query('policeStationId').optional().trim(),
        query('beatId').optional().trim(),
        query('districtId').optional().trim(),
        query('rangeId').optional().trim(),
        validate
    ],
    asyncHandler(CitizenController.map)
);

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
router.get(
    '/',
    requirePermission(Permission.CITIZENS_READ),
    [
        ...ValidationRules.pagination(),
        query('search').optional().trim(),
        query('policeStationId').optional().trim(),
        query('beatId').optional().trim(),
        query('districtId').optional().trim(),
        query('rangeId').optional().trim(),
        query('vulnerabilityLevel').optional().isIn(['Low', 'Medium', 'High']),
        query('verificationStatus').optional().isIn(['Pending', 'Verified', 'Rejected', 'FieldVerified', 'Suspended']),
        validate
    ],
    asyncHandler(CitizenController.list)
);

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
router.get(
    '/statistics',
    requirePermission(Permission.CITIZENS_READ),
    asyncHandler(CitizenController.getStatistics)
);

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
router.get(
    '/:id',
    requirePermission(Permission.CITIZENS_READ),
    [
        ValidationRules.id('id'),
        validate
    ],
    asyncHandler(CitizenController.getById)
);

router.post(
    '/',
    requirePermission(Permission.CITIZENS_WRITE),
    auditCRUD.create('citizen'),
    [
        body('fullName').trim().isLength({ min: 3, max: 80 }).withMessage('Full name must be 3-80 characters'),
        body('dateOfBirth').isISO8601().withMessage('Valid date of birth required'),
        body('gender').isIn(['Male', 'Female', 'Other', 'Prefer not to say']).withMessage('Valid gender required'),
        body('mobileNumber').matches(/^\+?(91)?[6-9]\d{9}$/).withMessage('Valid Indian mobile number required'),
        body('permanentAddress').notEmpty().withMessage('Permanent address required'),
        body('pinCode').matches(/^\d{6}$/).withMessage('Valid 6-digit PIN code required'),
        body('emergencyContacts').isArray({ min: 1 }).withMessage('At least one emergency contact required'),
        body('consentDataUse').equals('true').withMessage('Consent to data use is required'),
        validate
    ],
    asyncHandler(CitizenController.create)
);

router.put(
    '/:id',
    requirePermission(Permission.CITIZENS_WRITE),
    auditCRUD.update('citizen'),
    [
        ValidationRules.id('id'),
        body('fullName').optional().trim().isLength({ min: 3, max: 80 }),
        body('dateOfBirth').optional().isISO8601(),
        body('gender').optional().isIn(['Male', 'Female', 'Other', 'Prefer not to say']),
        body('mobileNumber').optional().matches(/^\+?(91)?[6-9]\d{9}$/),
        validate
    ],
    asyncHandler(CitizenController.updateProfile)
);

router.delete(
    '/:id',
    requirePermission(Permission.CITIZENS_DELETE),
    auditCRUD.delete('citizen'),
    [
        ValidationRules.id('id'),
        validate
    ],
    asyncHandler(CitizenController.delete)
);

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
router.patch(
    '/:id/verification',
    requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
    auditAction({ action: 'UPDATE_VERIFICATION_STATUS', resource: 'citizen', includeRequestBody: true }),
    [
        ValidationRules.id('id'),
        body('status').isIn(['Pending', 'Approved', 'Rejected']).withMessage('Valid status required'),
        body('remarks').optional().trim(),
        validate
    ],
    asyncHandler(CitizenController.updateVerificationStatus)
);

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
router.post(
    '/:id/digital-card',
    requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
    auditAction({ action: 'ISSUE_DIGITAL_CARD', resource: 'citizen' }),
    [
        ValidationRules.id('id'),
        validate
    ],
    asyncHandler(CitizenController.issueDigitalCard)
);

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
router.post(
    '/check-duplicates',
    requirePermission(Permission.CITIZENS_READ),
    [
        body('fullName').trim().notEmpty().withMessage('Full name required'),
        body('mobileNumber').matches(/^\+?(91)?[6-9]\d{9}$/).withMessage('Valid mobile number required'),
        body('aadhaarNumber').optional().trim(),
        body('dateOfBirth').optional().isISO8601(),
        validate
    ],
    asyncHandler(CitizenController.checkDuplicates)
);

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
router.get(
    '/duplicates/all',
    requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
    asyncHandler(CitizenController.findAllDuplicates)
);

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
router.get(
    '/:id/documents',
    requirePermission(Permission.CITIZENS_READ),
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { prisma } = await import('../config/database');
        const documents = await prisma.document.findMany({
            where: { seniorCitizenId: id },
            orderBy: { uploadedAt: 'desc' }
        });
        res.json({ success: true, data: { documents } });
    })
);

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
router.post(
    '/:id/documents',
    requirePermission(Permission.CITIZENS_WRITE),
    uploadSingle as any,
    asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;
            const { documentType } = req.body;
            const file = (req as any).file;

            console.log(`[Upload] Starting upload for citizen ${id}, type: ${documentType}`);

            if (!file) {
                console.error('[Upload] No file received by multer');
                return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
            }

            console.log(`[Upload] File received: ${file.originalname} (${file.size} bytes)`);

            const { prisma } = await import('../config/database');
            const { cloudStorage } = await import('../services/cloudStorageService');

            // Generate file URL using cloud service (handles local/cloud abstraction)
            let fileUrl;
            try {
                fileUrl = await cloudStorage.uploadFile(file.path, `${documentType}/${id}/${file.filename}`, file.mimetype);
                console.log(`[Upload] File processed by storage service: ${fileUrl}`);
            } catch (storageError) {
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
        } catch (error) {
            console.error('[Upload] Critical error:', error);
            return res.status(500).json({ success: false, error: { message: 'Upload failed', details: (error as any).message } });
        }
    })
);

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
router.delete(
    '/:id/documents/:docId',
    requirePermission(Permission.CITIZENS_DELETE),
    asyncHandler(async (req, res) => {
        const { docId } = req.params;
        const { prisma } = await import('../config/database');
        await prisma.document.delete({ where: { id: docId } });
        res.json({ success: true, message: 'Document deleted successfully' });
    })
);

export default router;
