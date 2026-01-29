declare class CloudStorageService {
    private config;
    private s3Client?;
    constructor();
    private initializeS3;
    uploadFile(filePath: string, key: string, contentType: string): Promise<string>;
    private uploadToS3;
    deleteFile(key: string): Promise<boolean>;
    getSignedUrl(key: string, expiresIn?: number): Promise<string>;
    private localStorageUrl;
    fileExists(key: string): Promise<boolean>;
}
export declare const cloudStorage: CloudStorageService;
export default cloudStorage;
//# sourceMappingURL=cloudStorageService.d.ts.map