import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Check if running in serverless environment
const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;

// Use /tmp for serverless (writable), ./uploads for traditional servers
const uploadDir = isServerless ? '/tmp/uploads' : path.join(process.cwd(), 'uploads');
const dirs = ['citizens', 'visits', 'documents', 'photos', 'digital-cards'];

// Create upload directories only if we have write access
dirs.forEach(dir => {
    const dirPath = path.join(uploadDir, dir);
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    } catch (error) {
        // In serverless, we'll create directories on-demand
        console.warn(`Could not pre-create upload directory ${dirPath}:`, error);
    }
});

// Configure storage
const storage = multer.diskStorage({
    destination: (req, _file, cb) => {
        // req.body might not be populated yet depending on field order, so use a sensible default
        const folder = req.body.folder || 'documents';
        const destinationPath = path.join(uploadDir, folder);

        // Create folder if it doesn't exist (on-demand creation for serverless)
        try {
            if (!fs.existsSync(destinationPath)) {
                fs.mkdirSync(destinationPath, { recursive: true });
            }
            cb(null, destinationPath);
        } catch (error) {
            console.error('Failed to create upload directory:', error);
            cb(new Error('Upload directory not accessible'), '');
        }
    },
    filename: (_req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = crypto.randomBytes(8).toString('hex');
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext);
        const safeBasename = basename.replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `${safeBasename}_${Date.now()}_${uniqueSuffix}${ext}`);
    }
});

// File filter
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} not allowed`));
    }
};

// Multer configuration
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
        files: 5, // Max 5 files per request
    }
});

// Single file upload
export const uploadSingle = upload.single('file');

// Multiple files upload
export const uploadMultiple = upload.array('files', 5);

// Fields upload (different field names)
export const uploadFields = upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'documents', maxCount: 5 }
]);
