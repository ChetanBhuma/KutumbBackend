"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = require("../config/multer");
const fileController_1 = require("../controllers/fileController");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const auth_1 = require("../types/auth");
const router = express_1.default.Router();
// Publicly accessible files (e.g. banners, generic assets) if any
// router.get('/public/:folder/:filename', servePublicFile); 
// All other file routes require authentication
router.use(authenticate_1.authenticate);
// Secure file serving
// Frontend should use: /api/v1/files/serve/:folder/:filename
/**
 * @swagger
 * /files/serve/{folder}/{filename}:
 *   get:
 *     tags: [Files]
 *     summary: Serve a secure file
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folder
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File content
 */
router.get('/serve/:folder/:filename', fileController_1.serveFile);
// Upload single file
/**
 * @swagger
 * /files/upload:
 *   post:
 *     tags: [Files]
 *     summary: Upload a single file
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded
 */
router.post('/upload', multer_1.uploadSingle, fileController_1.uploadFile);
// Upload multiple files
/**
 * @swagger
 * /files/upload-multiple:
 *   post:
 *     tags: [Files]
 *     summary: Upload multiple files
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Files uploaded
 */
router.post('/upload-multiple', multer_1.uploadMultiple, fileController_1.uploadMultipleFiles);
// Delete file
/**
 * @swagger
 * /files/delete:
 *   delete:
 *     tags: [Files]
 *     summary: Delete a file
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [filePath]
 *             properties:
 *               filePath:
 *                 type: string
 *     responses:
 *       200:
 *         description: File deleted
 */
router.delete('/delete', (0, authorize_1.requireRole)([auth_1.Role.ADMIN, auth_1.Role.SUPER_ADMIN, auth_1.Role.OFFICER]), fileController_1.deleteFile);
// Get file info
/**
 * @swagger
 * /files/info/{filePath}:
 *   get:
 *     tags: [Files]
 *     summary: Get file information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filePath
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File info
 */
router.get('/info/:filePath', fileController_1.getFileInfo);
// List files in folder
/**
 * @swagger
 * /files/list/{folder}:
 *   get:
 *     tags: [Files]
 *     summary: List files in a folder
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folder
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of files
 */
router.get('/list/:folder', fileController_1.listFiles);
exports.default = router;
//# sourceMappingURL=fileRoutes.js.map