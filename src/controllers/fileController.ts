import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { asyncHandler } from '../middleware/asyncHandler';
import { logger } from '../config/logger';

// Upload single file
export const uploadFile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded'
        });
    }

    const fileUrl = `/uploads/${req.body.folder}/${req.file.filename}`;

    logger.info('File uploaded', {
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
export const uploadMultipleFiles = asyncHandler(async (req: Request, res: Response) => {
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

    logger.info('Multiple files uploaded', {
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
export const deleteFile = asyncHandler(async (req: Request, res: Response) => {
    const { fileUrl } = req.body;

    if (!fileUrl) {
        return res.status(400).json({
            success: false,
            message: 'File URL is required'
        });
    }

    try {
        // Extract file path from URL
        const filePath = path.join(process.cwd(), fileUrl);

        // Check if file exists
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);

            logger.info('File deleted', {
                fileUrl,
                userId: req.user?.id
            });

            return res.status(200).json({
                success: true,
                message: 'File deleted successfully'
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }
    } catch (error: any) {
        logger.error('File deletion error', { error: error.message, fileUrl });
        return res.status(500).json({
            success: false,
            message: 'Failed to delete file'
        });
    }
});

// Get file info
export const getFileInfo = asyncHandler(async (req: Request, res: Response) => {
    const { filePath } = req.params;
    const fullPath = path.join(process.cwd(), 'uploads', filePath);

    if (!fs.existsSync(fullPath)) {
        return res.status(404).json({
            success: false,
            message: 'File not found'
        });
    }

    const stats = fs.statSync(fullPath);

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
export const listFiles = asyncHandler(async (req: Request, res: Response) => {
    const { folder } = req.params;

    // Security: Prevent Path Traversal
    if (folder.includes('..') || folder.includes('/') || folder.includes('\\')) {
        return res.status(400).json({ success: false, message: 'Invalid folder name' });
    }

    const folderPath = path.join(process.cwd(), 'uploads', folder);

    if (!fs.existsSync(folderPath)) {
        return res.status(404).json({
            success: false,
            message: 'Folder not found'
        });
    }

    const files = fs.readdirSync(folderPath).map(filename => {
        const filePath = path.join(folderPath, filename);
        const stats = fs.statSync(filePath);

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
export const serveFile = asyncHandler(async (req: Request, res: Response) => {
    const { folder, filename } = req.params;

    // Security: Prevent Path Traversal
    if (folder.includes('..') || folder.includes('/') || folder.includes('\\') ||
        filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({ success: false, message: 'Invalid path' });
    }

    const filePath = path.join(process.cwd(), 'uploads', folder, filename);

    if (!fs.existsSync(filePath)) {
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
