"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serveFile = exports.listFiles = exports.getFileInfo = exports.deleteFile = exports.uploadMultipleFiles = exports.uploadFile = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const asyncHandler_1 = require("../middleware/asyncHandler");
const logger_1 = require("../config/logger");
// Upload single file
exports.uploadFile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded'
        });
    }
    const fileUrl = `/uploads/${req.body.folder}/${req.file.filename}`;
    logger_1.logger.info('File uploaded', {
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        folder: req.body.folder,
        userId: req.user?.id
    });
    return res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            url: fileUrl,
            path: req.file.path
        }
    });
});
// Upload multiple files
exports.uploadMultipleFiles = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No files uploaded'
        });
    }
    const files = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/${req.body.folder}/${file.filename}`,
        path: file.path
    }));
    logger_1.logger.info('Multiple files uploaded', {
        count: files.length,
        userId: req.user?.id
    });
    return res.status(200).json({
        success: true,
        message: `${files.length} files uploaded successfully`,
        data: { files }
    });
});
// Delete file
exports.deleteFile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { fileUrl } = req.body;
    if (!fileUrl) {
        return res.status(400).json({
            success: false,
            message: 'File URL is required'
        });
    }
    try {
        // Extract file path from URL
        const filePath = path_1.default.join(process.cwd(), fileUrl);
        // Check if file exists
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
            logger_1.logger.info('File deleted', {
                fileUrl,
                userId: req.user?.id
            });
            return res.status(200).json({
                success: true,
                message: 'File deleted successfully'
            });
        }
        else {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }
    }
    catch (error) {
        logger_1.logger.error('File deletion error', { error: error.message, fileUrl });
        return res.status(500).json({
            success: false,
            message: 'Failed to delete file'
        });
    }
});
// Get file info
exports.getFileInfo = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { filePath } = req.params;
    const fullPath = path_1.default.join(process.cwd(), 'uploads', filePath);
    if (!fs_1.default.existsSync(fullPath)) {
        return res.status(404).json({
            success: false,
            message: 'File not found'
        });
    }
    const stats = fs_1.default.statSync(fullPath);
    return res.status(200).json({
        success: true,
        data: {
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory()
        }
    });
});
// List files in folder
exports.listFiles = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { folder } = req.params;
    // Security: Prevent Path Traversal
    if (folder.includes('..') || folder.includes('/') || folder.includes('\\')) {
        return res.status(400).json({ success: false, message: 'Invalid folder name' });
    }
    const folderPath = path_1.default.join(process.cwd(), 'uploads', folder);
    if (!fs_1.default.existsSync(folderPath)) {
        return res.status(404).json({
            success: false,
            message: 'Folder not found'
        });
    }
    const files = fs_1.default.readdirSync(folderPath).map(filename => {
        const filePath = path_1.default.join(folderPath, filename);
        const stats = fs_1.default.statSync(filePath);
        return {
            filename,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            url: `/uploads/${folder}/${filename}`
        };
    });
    return res.status(200).json({
        success: true,
        data: {
            folder,
            count: files.length,
            files
        }
    });
});
// Serve file securely
exports.serveFile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { folder, filename } = req.params;
    // Security: Prevent Path Traversal
    if (folder.includes('..') || folder.includes('/') || folder.includes('\\') ||
        filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({ success: false, message: 'Invalid path' });
    }
    const filePath = path_1.default.join(process.cwd(), 'uploads', folder, filename);
    if (!fs_1.default.existsSync(filePath)) {
        return res.status(404).json({
            success: false,
            message: 'File not found'
        });
    }
    // Check if user has permission (integrated with route middleware usually, but can double check)
    // For now, we assume route middleware 'authenticate' handled basic auth.
    // Specific business logic permissions (e.g. can user X view file Y) would go here.
    return res.sendFile(filePath);
});
//# sourceMappingURL=fileController.js.map