"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const citizenPortalController_1 = require("../controllers/citizenPortalController");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const auth_1 = require("../types/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
router.post('/registrations/start', [
    (0, express_validator_1.body)('mobileNumber').matches(/^(\+?91)?\s?[6-9]\d{9}$/).withMessage('Valid mobile number required'),
    (0, express_validator_1.body)('fullName').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    (0, express_validator_1.body)('dateOfBirth').optional().isISO8601().withMessage('Valid date of birth required'),
    validate_1.validate
], citizenPortalController_1.CitizenPortalController.startRegistration);
router.get('/registrations/:id', [
    (0, express_validator_1.param)('id').notEmpty().withMessage('Registration ID is required'),
    validate_1.validate
], citizenPortalController_1.CitizenPortalController.getRegistration);
router.patch('/registrations/:id', [
    (0, express_validator_1.param)('id').notEmpty().withMessage('Registration ID is required'),
    validate_1.validate
], citizenPortalController_1.CitizenPortalController.saveRegistrationStep);
router.post('/registrations/:id/verify-otp', [
    (0, express_validator_1.param)('id').notEmpty().withMessage('Registration ID is required'),
    (0, express_validator_1.body)('otp').isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit OTP required'),
    validate_1.validate
], citizenPortalController_1.CitizenPortalController.verifyOTP);
router.get('/registrations/:id/details', authenticate_1.authenticate, authenticate_1.authenticate, [
    (0, express_validator_1.param)('id').notEmpty().withMessage('Registration ID is required'),
    validate_1.validate
], citizenPortalController_1.CitizenPortalController.getRegistrationDetails);
router.post('/registrations/:id/submit', [
    (0, express_validator_1.param)('id').notEmpty().withMessage('Registration ID is required'),
    (0, express_validator_1.body)('citizenData').notEmpty().withMessage('Citizen data is required'),
    validate_1.validate
], citizenPortalController_1.CitizenPortalController.submitRegistration);
router.get('/registrations', authenticate_1.authenticate, (0, authorize_1.requirePermission)(auth_1.Permission.CITIZENS_READ), [
    (0, express_validator_1.query)('status').optional().isString(),
    validate_1.validate
], citizenPortalController_1.CitizenPortalController.listRegistrations);
router.patch('/registrations/:id/status', authenticate_1.authenticate, (0, authorize_1.requirePermission)(auth_1.Permission.CITIZENS_WRITE), [
    (0, express_validator_1.param)('id').notEmpty().withMessage('Registration ID is required'),
    (0, express_validator_1.body)('status').isString().withMessage('Status is required'),
    validate_1.validate
], citizenPortalController_1.CitizenPortalController.updateRegistrationStatus);
router.post('/citizens/:id/visit-requests', [
    (0, express_validator_1.param)('id').notEmpty().withMessage('Citizen ID is required'),
    (0, express_validator_1.body)('preferredDate').optional().isISO8601().withMessage('Invalid preferred date'),
    (0, express_validator_1.body)('preferredTimeSlot').optional().isString(),
    (0, express_validator_1.body)('visitType').optional().isString(),
    validate_1.validate
], citizenPortalController_1.CitizenPortalController.createVisitRequest);
router.post('/registrations/:id/visit-requests', [
    (0, express_validator_1.param)('id').notEmpty().withMessage('Registration ID is required'),
    (0, express_validator_1.body)('preferredDate').optional().isISO8601().withMessage('Invalid preferred date'),
    (0, express_validator_1.body)('preferredTimeSlot').optional().isString(),
    (0, express_validator_1.body)('visitType').optional().isString(),
    validate_1.validate
], citizenPortalController_1.CitizenPortalController.createRegistrationVisitRequest);
router.get('/visit-requests', authenticate_1.authenticate, (0, authorize_1.requirePermission)(auth_1.Permission.VISITS_READ), [
    (0, express_validator_1.query)('status').optional().isString(),
    validate_1.validate
], citizenPortalController_1.CitizenPortalController.listVisitRequests);
router.patch('/visit-requests/:id', authenticate_1.authenticate, (0, authorize_1.requirePermission)(auth_1.Permission.VISITS_SCHEDULE), [
    (0, express_validator_1.param)('id').notEmpty().withMessage('Visit request ID is required'),
    (0, express_validator_1.body)('status').isString().withMessage('Status is required'),
    validate_1.validate
], citizenPortalController_1.CitizenPortalController.updateVisitRequestStatus);
router.get('/my-visits', authenticate_1.authenticate, 
// requirePermission(Permission.VISITS_READ), // Not needed for self-service
[
// query('page').optional().isInt({ min: 1 }),
// query('limit').optional().isInt({ min: 1, max: 50 }),
// query('status').optional().isString(),
// validate
], citizenPortalController_1.CitizenPortalController.getMyVisits);
exports.default = router;
//# sourceMappingURL=citizenPortalRoutes.js.map