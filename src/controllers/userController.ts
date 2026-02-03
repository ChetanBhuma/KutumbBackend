import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { PasswordService } from '../services/passwordService';
import { paginatedQuery } from '../utils/pagination';
import { buildOrderBy } from '../utils/queryBuilder';
import { AuditService } from '../services/AuditService';

// Define a minimal AuthRequest interface here or import it
interface AuthRequest extends Request {
    user?: { id: string; email: string; role: string };
}

// OPTIMIZATION: Cache roles to avoid fetching on every request (roles rarely change)
let cachedRoles: Record<string, any> | null = null;
let rolesCacheTime = 0;
const ROLES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedRoleMap(): Promise<Record<string, any>> {
    const now = Date.now();
    if (!cachedRoles || now - rolesCacheTime > ROLES_CACHE_TTL) {
        const roles = await prisma.role.findMany({
            include: { permissions: { select: { code: true } } }
        });
        cachedRoles = roles.reduce<Record<string, any>>((acc, roleItem) => {
            acc[roleItem.code] = {
                ...roleItem,
                permissions: roleItem.permissions.map(p => p.code)
            };
            return acc;
        }, {});
        rolesCacheTime = now;
    }
    return cachedRoles;
}

export const listUsers = async (req: Request, res: Response) => {
    try {
        const {
            search,
            role,
            status,
        } = req.query;

        const where: any = {};

        if (search) {
            where.OR = [
                { email: { contains: String(search), mode: 'insensitive' } },
                { phone: { contains: String(search) } },
                {
                    SeniorCitizen: {
                        fullName: { contains: String(search), mode: 'insensitive' }
                    }
                }
            ];
        }

        if (role && role !== 'all') {
            where.role = String(role);
        }

        if (status === 'active') {
            where.isActive = true;
        } else if (status === 'inactive') {
            where.isActive = false;
        }

        // OPTIMIZATION: Use cached roles instead of fetching every time
        const roleMap = await getCachedRoleMap();

        const result = await paginatedQuery(prisma.user, {
            page: Number(req.query.page),
            limit: Number(req.query.limit),
            where,
            include: {
                SeniorCitizen: {
                    select: {
                        id: true,
                        fullName: true,
                        mobileNumber: true,
                        permanentAddress: true,
                        vulnerabilityLevel: true,
                    }
                },
                // OPTIMIZATION: Only fetch essential officer fields, skip nested relations for list view
                officerProfile: {
                    select: {
                        id: true,
                        rank: true,
                        name: true,
                        badgeNumber: true,
                        // Fetch only IDs for list view, full names can be fetched on detail view
                        districtId: true,
                        policeStationId: true,
                        beatId: true
                    }
                }
            },
            orderBy: buildOrderBy(req.query, { createdAt: 'desc' })
        });

        // Transform items
        const transformedItems = result.items.map((user: any) => {
            const { passwordHash, ...safeUser } = user;
            const roleCode = user.role || undefined;
            return {
                ...safeUser,
                role: roleCode || '',
                displayName: user.SeniorCitizen?.fullName || user.email.split('@')[0],
                roleDetails: roleCode ? roleMap[roleCode] || null : null,
            };
        });

        return res.json({
            success: true,
            data: {
                users: transformedItems,
                pagination: result.pagination
            }
        });
    } catch (error) {
        console.error('List users error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching users',
        });
    }
};

export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { roleCode } = req.body;
        const currentUser = (req as AuthRequest).user;

        if (!roleCode) {
            return res.status(400).json({
                success: false,
                message: 'roleCode is required',
            });
        }

        const role = await prisma.role.findUnique({
            where: { code: roleCode },
        });

        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found',
            });
        }

        const user = await prisma.user.update({
            where: { id },
            data: {
                role: roleCode,
                updatedAt: new Date(),
            },
            select: {
                id: true,
                email: true,
                phone: true,
                role: true,
                updatedAt: true,
            },
        });

        await AuditService.log(
            currentUser?.id || 'SYSTEM',
            'UPDATE_USER_ROLE',
            'User',
            id,
            { oldRole: user.role, newRole: roleCode },
            req.ip || '0.0.0.0',
            req.get('user-agent') || 'Unknown'
        );

        return res.json({
            success: true,
            data: user,
            message: 'User role updated successfully',
        });
    } catch (error) {
        console.error('Update user role error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating user role',
        });
    }
};

export const updateUserStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const currentUser = (req as AuthRequest).user;

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isActive boolean is required',
            });
        }

        const user = await prisma.user.update({
            where: { id },
            data: { isActive },
        });

        await AuditService.log(
            currentUser?.id || 'SYSTEM',
            'UPDATE_USER_STATUS',
            'User',
            id,
            { status: isActive ? 'Active' : 'Inactive' },
            req.ip || '0.0.0.0',
            req.get('user-agent') || 'Unknown'
        );

        return res.json({
            success: true,
            data: user,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        });
    } catch (error) {
        console.error('Update user status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating user status',
        });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { email, phone } = req.body;
        const currentUser = (req as AuthRequest).user;

        const existing = await prisma.user.findUnique({
            where: { id },
            include: { officerProfile: true }
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Transaction: Update User AND BeatOfficer (if linked)
        const updatedUser = await prisma.$transaction(async (tx) => {
            const user = await tx.user.update({
                where: { id },
                data: {
                    email: email || undefined,
                    phone: phone || undefined
                }
            });

            if (existing.officerProfile) {
                const officerUpdateData: any = {};
                if (email) officerUpdateData.email = email;
                if (phone) officerUpdateData.mobileNumber = phone;

                if (Object.keys(officerUpdateData).length > 0) {
                    await tx.beatOfficer.update({
                        where: { id: existing.officerProfile.id },
                        data: officerUpdateData
                    });
                }
            }

            return user;
        });

        await AuditService.log(
            currentUser?.id || 'SYSTEM',
            'UPDATE_USER',
            'User',
            id,
            { email, phone },
            req.ip || '0.0.0.0',
            req.get('user-agent') || 'Unknown'
        );

        return res.json({
            success: true,
            data: updatedUser,
            message: 'User updated successfully',
        });
    } catch (error) {
        console.error('Update user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating user',
        });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const { email, phone, password, roleCode, name, badgeNumber, jurisdiction } = req.body;
        const currentUser = (req as AuthRequest).user;

        if (!email || !phone || !roleCode) {
            return res.status(400).json({
                success: false,
                message: 'email, phone, and roleCode are required',
            });
        }

        const role = await prisma.role.findUnique({
            where: { code: roleCode },
        });

        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found',
            });
        }

        const existing = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { phone }],
            },
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'User with this email or phone already exists',
            });
        }

        // Determine if this is an officer role that requires profile creation
        const officerRoles = ['COMMISSIONER', 'JOINT_CP', 'DCP', 'ACP', 'SHO', 'BEAT_OFFICER', 'CONSTABLE']; // Adjust codes as per DB
        // Also allow generic 'OFFICER' if used.
        // For accurate mapping, we assume roleCode matches or maps to a rank.

        const isOfficer = officerRoles.includes(roleCode) || roleCode.includes('ADMIN') === false; // Simplified heuristic, better to check specific list

        // Strict Check for Officer Creation fields if it is an officer role
        if (isOfficer && roleCode !== 'CITIZEN') {
            // Excluding CITIZEN as they have separate flow usually, but if created from Admin, they might need SeniorCitizen profile?
            // For now, focus on Police Officers as per request "map to district...".

            if (!name || !badgeNumber) {
                 return res.status(400).json({
                    success: false,
                    message: 'name and badgeNumber are required for officer users',
                });
            }
        }

        const passwordToUse = password || 'ChangeMe@123';
        const passwordHash = await PasswordService.hash(passwordToUse);

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    phone,
                    passwordHash,
                    role: roleCode,
                    isActive: true,
                },
            });

            // If it's an officer role, create BeatOfficer profile
            if (isOfficer && roleCode !== 'CITIZEN' && roleCode !== 'SUPER_ADMIN') {
                 // Validate Jurisdiction based on role
                 const juris = jurisdiction || {};

                 // Normalize inputs to arrays
                 const rangeIds = Array.isArray(juris.rangeIds) ? juris.rangeIds : (juris.rangeId ? [juris.rangeId] : []);
                 const districtIds = Array.isArray(juris.districtIds) ? juris.districtIds : (juris.districtId ? [juris.districtId] : []);
                 const subDivisionIds = Array.isArray(juris.subDivisionIds) ? juris.subDivisionIds : (juris.subDivisionId ? [juris.subDivisionId] : []);
                 const policeStationIds = Array.isArray(juris.policeStationIds) ? juris.policeStationIds : (juris.policeStationId ? [juris.policeStationId] : []);
                 const beatIds = Array.isArray(juris.beatIds) ? juris.beatIds : (juris.beatId ? [juris.beatId] : []);

                 const officer = await tx.beatOfficer.create({
                     data: {
                         name,
                         rank: roleCode,
                         badgeNumber,
                         mobileNumber: phone,
                         email: email,

                         // LEGACY: Primary Jurisdiction (First item)
                         rangeId: rangeIds[0],
                         districtId: districtIds[0],
                         subDivisionId: subDivisionIds[0],
                         policeStationId: policeStationIds[0],
                         beatId: beatIds[0],

                         // NEW: Managed Jurisdictions (Many-to-Many)
                         managedRanges: { connect: rangeIds.map((id: string) => ({ id })) },
                         managedDistricts: { connect: districtIds.map((id: string) => ({ id })) },
                         managedSubDivisions: { connect: subDivisionIds.map((id: string) => ({ id })) },
                         managedPoliceStations: { connect: policeStationIds.map((id: string) => ({ id })) },
                         managedBeats: { connect: beatIds.map((id: string) => ({ id })) },

                         // Link to User
                         user: {
                             connect: { id: user.id }
                         }
                     }
                 });

                 await tx.user.update({
                     where: { id: user.id },
                     data: { officerId: officer.id }
                 });

                 return { user, officer };
            }

            return { user, officer: null };
        });

        await AuditService.log(
            currentUser?.id || 'SYSTEM',
            'CREATE_USER',
            'User',
            result.user.id,
            { email, role: roleCode },
            req.ip || '0.0.0.0',
            req.get('user-agent') || 'Unknown'
        );

        return res.status(201).json({
            success: true,
            data: {
                ...result.user,
                officerProfile: result.officer,
                tempPassword: password ? undefined : passwordToUse,
            },
            message: 'User created successfully',
        });
    } catch (error) {
        console.error('Create user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating user',
        });
    }
};
