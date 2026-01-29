import { Request, Response } from 'express';
export declare const getHealthConditions: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getHealthConditionById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createHealthCondition: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateHealthCondition: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteHealthCondition: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=healthConditionController.d.ts.map