"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncBulkController = void 0;
const citizenImportQueue_1 = require("../queues/citizenImportQueue");
const csv_parser_1 = __importDefault(require("csv-parser"));
const stream_1 = require("stream");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../config/logger");
class AsyncBulkController {
    /**
     * Queue large CSV imports for background processing
     */
    static async queueCitizenImport(req, res, next) {
        try {
            if (!req.file) {
                throw new errorHandler_1.AppError('CSV file is required', 400);
            }
            const results = [];
            // Parse CSV
            const stream = stream_1.Readable.from(req.file.buffer.toString());
            await new Promise((resolve, reject) => {
                stream
                    .pipe((0, csv_parser_1.default)())
                    .on('data', (row) => results.push(row))
                    .on('end', resolve)
                    .on('error', reject);
            });
            // Queue each row as a separate job
            const jobs = results.map((row, index) => citizenImportQueue_1.citizenImportQueue.add({
                row,
                rowIndex: index + 1,
                importedBy: req.user?.email || 'Unknown'
            }));
            await Promise.all(jobs);
            logger_1.auditLogger.info('Bulk import queued', {
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get import job status
     */
    static async getImportStatus(_req, res) {
        const waiting = await citizenImportQueue_1.citizenImportQueue.getWaitingCount();
        const active = await citizenImportQueue_1.citizenImportQueue.getActiveCount();
        const completed = await citizenImportQueue_1.citizenImportQueue.getCompletedCount();
        const failed = await citizenImportQueue_1.citizenImportQueue.getFailedCount();
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
exports.AsyncBulkController = AsyncBulkController;
//# sourceMappingURL=asyncBulkController.js.map