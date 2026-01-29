import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { CitizenPortalController } from '../controllers/citizenPortalController';
import { authenticate } from '../middleware/authenticate';
import { requirePermission } from '../middleware/authorize';
import { Permission } from '../types/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.post(
    '/registrations/start',
    [
        body('mobileNumber').matches(/^(\+?91)?\s?[6-9]\d{9}$/).withMessage('Valid mobile number required'),
        body('fullName').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
        body('dateOfBirth').optional().isISO8601().withMessage('Valid date of birth required'),
        validate
    ],
    CitizenPortalController.startRegistration
);

router.get(
    '/registrations/:id',
    [
        param('id').notEmpty().withMessage('Registration ID is required'),
        validate
    ],
    CitizenPortalController.getRegistration
);

router.patch(
    '/registrations/:id',
    [
        param('id').notEmpty().withMessage('Registration ID is required'),
        validate
    ],
    CitizenPortalController.saveRegistrationStep
);

router.post(
    '/registrations/:id/verify-otp',
    [
        param('id').notEmpty().withMessage('Registration ID is required'),
        body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit OTP required'),
        validate
    ],
    CitizenPortalController.verifyOTP
);

router.get(
    '/registrations/:id/details',
    authenticate,
    authenticate,
    [
        param('id').notEmpty().withMessage('Registration ID is required'),
        validate
    ],
    CitizenPortalController.getRegistrationDetails
);

router.post(
    '/registrations/:id/submit',
    [
        param('id').notEmpty().withMessage('Registration ID is required'),
        body('citizenData').notEmpty().withMessage('Citizen data is required'),
        validate
    ],
    CitizenPortalController.submitRegistration
);

router.get(
    '/registrations',
    authenticate,
    requirePermission(Permission.CITIZENS_READ),
    [
        query('status').optional().isString(),
        validate
    ],
    CitizenPortalController.listRegistrations
);

router.patch(
    '/registrations/:id/status',
    authenticate,
    requirePermission(Permission.CITIZENS_WRITE),
    [
        param('id').notEmpty().withMessage('Registration ID is required'),
        body('status').isString().withMessage('Status is required'),
        validate
    ],
    CitizenPortalController.updateRegistrationStatus
);

router.post(
    '/citizens/:id/visit-requests',
    [
        param('id').notEmpty().withMessage('Citizen ID is required'),
        body('preferredDate').optional().isISO8601().withMessage('Invalid preferred date'),
        body('preferredTimeSlot').optional().isString(),
        body('visitType').optional().isString(),
        validate
    ],
    CitizenPortalController.createVisitRequest
);

router.post(
    '/registrations/:id/visit-requests',
    [
        param('id').notEmpty().withMessage('Registration ID is required'),
        body('preferredDate').optional().isISO8601().withMessage('Invalid preferred date'),
        body('preferredTimeSlot').optional().isString(),
        body('visitType').optional().isString(),
        validate
    ],
    CitizenPortalController.createRegistrationVisitRequest
);

router.get(
    '/visit-requests',
    authenticate,
    requirePermission(Permission.VISITS_READ),
    [
        query('status').optional().isString(),
        validate
    ],
    CitizenPortalController.listVisitRequests
);

router.patch(
    '/visit-requests/:id',
    authenticate,
    requirePermission(Permission.VISITS_SCHEDULE),
    [
        param('id').notEmpty().withMessage('Visit request ID is required'),
        body('status').isString().withMessage('Status is required'),
        validate
    ],
    CitizenPortalController.updateVisitRequestStatus
);


router.get(
    '/my-visits',
    authenticate,
    // requirePermission(Permission.VISITS_READ), // Not needed for self-service
    [
        // query('page').optional().isInt({ min: 1 }),
        // query('limit').optional().isInt({ min: 1, max: 50 }),
        // query('status').optional().isString(),
        // validate
    ],
    CitizenPortalController.getMyVisits
);

export default router;
