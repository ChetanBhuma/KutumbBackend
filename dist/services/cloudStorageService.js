"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudStorage = void 0;
// Cloud Storage Service - Supports AWS S3, Azure Blob, Google Cloud Storage
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../config/logger");
class CloudStorageService {
    config;
    s3Client;
    constructor() {
        this.config = {
            provider: process.env.CLOUD_STORAGE_PROVIDER || 'local',
            bucket: process.env.CLOUD_STORAGE_BUCKET,
            accessKey: process.env.CLOUD_STORAGE_ACCESS_KEY,
            secretKey: process.env.CLOUD_STORAGE_SECRET_KEY,
            region: process.env.CLOUD_STORAGE_REGION || 'ap-south-1',
        };
        if (this.config.provider === 'aws') {
            this.initializeS3();
        }
    }
    initializeS3() {
        if (!this.config.accessKey || !this.config.secretKey) {
            logger_1.logger.warn('AWS S3 credentials not configured, using local storage');
            return;
        }
        this.s3Client = new client_s3_1.S3Client({
            region: this.config.region,
            credentials: {
                accessKeyId: this.config.accessKey,
                secretAccessKey: this.config.secretKey,
            },
        });
        logger_1.logger.info('AWS S3 client initialized', { region: this.config.region });
    }
    // Upload file to cloud storage
    async uploadFile(filePath, key, contentType) {
        try {
            if (this.config.provider === 'aws' && this.s3Client) {
                return await this.uploadToS3(filePath, key, contentType);
            }
            // Default to local storage
            return this.localStorageUrl(filePath);
        }
        catch (error) {
            logger_1.logger.error('Cloud upload failed', { error: error.message, key });
            throw error;
        }
    }
    async uploadToS3(filePath, key, contentType) {
        if (!this.s3Client || !this.config.bucket) {
            throw new Error('S3 client not initialized');
        }
        const fileContent = fs_1.default.readFileSync(filePath);
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.config.bucket,
            Key: key,
            Body: fileContent,
            ContentType: contentType,
        });
        await this.s3Client.send(command);
        logger_1.logger.info('File uploaded to S3', { bucket: this.config.bucket, key });
        // Return public URL
        return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
    }
    // Delete file from cloud storage
    async deleteFile(key) {
        try {
            if (this.config.provider === 'aws' && this.s3Client && this.config.bucket) {
                const command = new client_s3_1.DeleteObjectCommand({
                    Bucket: this.config.bucket,
                    Key: key,
                });
                await this.s3Client.send(command);
                logger_1.logger.info('File deleted from S3', { key });
                return true;
            }
            // Local storage deletion
            const localPath = path_1.default.join(process.cwd(), 'uploads', key);
            if (fs_1.default.existsSync(localPath)) {
                fs_1.default.unlinkSync(localPath);
                return true;
            }
            return false;
        }
        catch (error) {
            logger_1.logger.error('Cloud delete failed', { error: error.message, key });
            return false;
        }
    }
    // Generate signed URL for private access
    async getSignedUrl(key, expiresIn = 3600) {
        if (this.config.provider === 'aws' && this.s3Client && this.config.bucket) {
            const command = new client_s3_1.GetObjectCommand({
                Bucket: this.config.bucket,
                Key: key,
            });
            return await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn });
        }
        // Local storage - return direct path
        return `/uploads/${key}`;
    }
    // Get local storage URL
    localStorageUrl(filePath) {
        // Normalize path separators to forward slashes for URL
        const normalizedPath = filePath.split(path_1.default.sep).join('/');
        const cwd = process.cwd().split(path_1.default.sep).join('/');
        let url = normalizedPath.replace(cwd, '');
        // Ensure it starts with /uploads/ if it doesn't already
        if (!url.startsWith('/uploads/')) {
            // Find where uploads starts
            const uploadIndex = url.indexOf('/uploads/');
            if (uploadIndex !== -1) {
                url = url.substring(uploadIndex);
            }
        }
        // Ensure leading slash
        if (!url.startsWith('/')) {
            url = '/' + url;
        }
        console.log(`DEBUG: Local Storage URL conversion: ${filePath} -> ${url}`);
        return url;
    }
    // Check if file exists
    async fileExists(key) {
        if (this.config.provider === 'aws' && this.s3Client && this.config.bucket) {
            try {
                const command = new client_s3_1.GetObjectCommand({
                    Bucket: this.config.bucket,
                    Key: key,
                });
                await this.s3Client.send(command);
                return true;
            }
            catch {
                return false;
            }
        }
        // Local storage
        const localPath = path_1.default.join(process.cwd(), 'uploads', key);
        return fs_1.default.existsSync(localPath);
    }
}
exports.cloudStorage = new CloudStorageService();
exports.default = exports.cloudStorage;
//# sourceMappingURL=cloudStorageService.js.map