import { Request, Response } from 'express';
export declare const startWorkflow: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const approveWorkflowStep: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const rejectWorkflowStep: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getPendingApprovals: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getWorkflowStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=workflowController.d.ts.map