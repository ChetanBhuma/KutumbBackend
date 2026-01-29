// Cloud Storage Service - Supports AWS S3, Azure Blob, Google Cloud Storage
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import { logger } from '../config/logger';

interface CloudStorageConfig {
    provider: 'aws' | 'azure' | 'gcp' | 'local';
    bucket?: string;
    accessKey?: string;
    secretKey?: string;
    region?: string;
}

class CloudStorageService {
    private config: CloudStorageConfig;
    private s3Client?: S3Client;

    constructor() {
        this.config = {
            provider: (process.env.CLOUD_STORAGE_PROVIDER as any) || 'local',
            bucket: process.env.CLOUD_STORAGE_BUCKET,
            accessKey: process.env.CLOUD_STORAGE_ACCESS_KEY,
            secretKey: process.env.CLOUD_STORAGE_SECRET_KEY,
            region: process.env.CLOUD_STORAGE_REGION || 'ap-south-1',
        };

        if (this.config.provider === 'aws') {
            this.initializeS3();
        }
    }

    private initializeS3() {
        if (!this.config.accessKey || !this.config.secretKey) {
            logger.warn('AWS S3 credentials not configured, using local storage');
            return;
        }

        this.s3Client = new S3Client({
            region: this.config.region,
            credentials: {
                accessKeyId: this.config.accessKey!,
                secretAccessKey: this.config.secretKey!,
            },
        });

        logger.info('AWS S3 client initialized', { region: this.config.region });
    }

    // Upload file to cloud storage
    async uploadFile(filePath: string, key: string, contentType: string): Promise<string> {
        try {
            if (this.config.provider === 'aws' && this.s3Client) {
                return await this.uploadToS3(filePath, key, contentType);
            }

            // Default to local storage
            return this.localStorageUrl(filePath);
        } catch (error: any) {
            logger.error('Cloud upload failed', { error: error.message, key });
            throw error;
        }
    }

    private async uploadToS3(filePath: string, key: string, contentType: string): Promise<string> {
        if (!this.s3Client || !this.config.bucket) {
            throw new Error('S3 client not initialized');
        }

        const fileContent = fs.readFileSync(filePath);

        const command = new PutObjectCommand({
            Bucket: this.config.bucket,
            Key: key,
            Body: fileContent,
            ContentType: contentType,
        });

        await this.s3Client.send(command);

        logger.info('File uploaded to S3', { bucket: this.config.bucket, key });

        // Return public URL
        return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
    }

    // Delete file from cloud storage
    async deleteFile(key: string): Promise<boolean> {
        try {
            if (this.config.provider === 'aws' && this.s3Client && this.config.bucket) {
                const command = new DeleteObjectCommand({
                    Bucket: this.config.bucket,
                    Key: key,
                });

                await this.s3Client.send(command);
                logger.info('File deleted from S3', { key });
                return true;
            }

            // Local storage deletion
            const localPath = path.join(process.cwd(), 'uploads', key);
            if (fs.existsSync(localPath)) {
                fs.unlinkSync(localPath);
                return true;
            }

            return false;
        } catch (error: any) {
            logger.error('Cloud delete failed', { error: error.message, key });
            return false;
        }
    }

    // Generate signed URL for private access
    async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
        if (this.config.provider === 'aws' && this.s3Client && this.config.bucket) {
            const command = new GetObjectCommand({
                Bucket: this.config.bucket,
                Key: key,
            });

            return await getSignedUrl(this.s3Client, command, { expiresIn });
        }

        // Local storage - return direct path
        return `/uploads/${key}`;
    }

    // Get local storage URL
    private localStorageUrl(filePath: string): string {
        // Normalize path separators to forward slashes for URL
        const normalizedPath = filePath.split(path.sep).join('/');
        const cwd = process.cwd().split(path.sep).join('/');

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


        return url;
    }

    // Check if file exists
    async fileExists(key: string): Promise<boolean> {
        if (this.config.provider === 'aws' && this.s3Client && this.config.bucket) {
            try {
                const command = new GetObjectCommand({
                    Bucket: this.config.bucket,
                    Key: key,
                });
                await this.s3Client.send(command);
                return true;
            } catch {
                return false;
            }
        }

        // Local storage
        const localPath = path.join(process.cwd(), 'uploads', key);
        return fs.existsSync(localPath);
    }
}

export const cloudStorage = new CloudStorageService();
export default cloudStorage;
