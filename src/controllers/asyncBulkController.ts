import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { citizenImportQueue } from '../queues/citizenImportQueue';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { AppError } from '../middleware/errorHandler';
import { auditLogger } from '../config/logger';

export class AsyncBulkController {
    /**
     * Queue large CSV imports for background processing
     */
    static async queueCitizenImport(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.file) {
                throw new AppError('CSV file is required', 400);
            }

            const results: any[] = [];

            // Parse CSV
            const stream = Readable.from(req.file.buffer.toString());

            await new Promise((resolve, reject) => {
                stream
                    .pipe(csv())
                    .on('data', (row: any) => results.push(row))
                    .on('end', resolve)
                    .on('error', reject);
            });

            // Queue each row as a separate job
            const jobs = results.map((row, index) =>
                citizenImportQueue.add({
                    row,
                    rowIndex: index + 1,
                    importedBy: req.user?.email || 'Unknown'
                })
            );

            await Promise.all(jobs);

            auditLogger.info('Bulk import queued', {
                totalRows: results.length,
                queuedBy: req.user?.email
            });

            res.json({
                success: true,
                message: `Queued ${results.length} citizens for import. Processing in background.`,
                data: {
                    totalQueued: results.length,
                    queueName: 'citizen-import'
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get import job status
     */
    static async getImportStatus(_req: Request, res: Response) {
        const waiting = await citizenImportQueue.getWaitingCount();
        const active = await citizenImportQueue.getActiveCount();
        const completed = await citizenImportQueue.getCompletedCount();
        const failed = await citizenImportQueue.getFailedCount();

        res.json({
            success: true,
            data: {
                waiting,
                active,
                completed,
                failed,
                total: waiting + active + completed + failed
            }
        });
    }
}
