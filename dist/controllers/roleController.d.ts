import { Request, Response } from 'express';
/**
 * List all roles
 */
export declare const listRoles: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get role by ID
 */
export declare const getRoleById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Create a new custom role
 */
export declare const createRole: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Update role (permissions, name, description)
 */
export declare const updateRole: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Delete Role
 * Protects system roles (defined in AUTH types) from deletion if necessary,
 * or checks for existing user assignments.
 */
export declare const deleteRole: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * List all available system permissions (Enum values)
 * Used for building the "Edit Role" UI
 */
export declare const listSystemPermissions: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get Role Matrix (Roles + Users with Role Codes)
 */
export declare const getRoleMatrix: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=roleController.d.ts.map