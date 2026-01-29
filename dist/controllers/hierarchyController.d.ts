import { Request, Response } from 'express';
/**
 * Get full organizational hierarchy tree
 * Structure: Range -> District -> Station -> Beat
 * (SubDivision and Post are skipped as they don't exist in DB)
 */
export declare const getHierarchyTree: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=hierarchyController.d.ts.map