import Queue from 'bull';
/**
 * Job queue for processing large CSV imports
 * Uses Bull with Redis for distributed processing
 */
interface CitizenImportJob {
    row: any;
    rowIndex: number;
    importedBy: string;
}
export declare const citizenImportQueue: Queue.Queue<CitizenImportJob>;
export {};
//# sourceMappingURL=citizenImportQueue.d.ts.map