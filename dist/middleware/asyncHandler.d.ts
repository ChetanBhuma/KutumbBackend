import { Request, Response, NextFunction, RequestHandler } from 'express';
/**
 * Async handler wrapper to catch errors in async route handlers
 * @param fn - Async function to wrap
 */
export declare const asyncHandler: (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) => void;
export default asyncHandler;
//# sourceMappingURL=asyncHandler.d.ts.map