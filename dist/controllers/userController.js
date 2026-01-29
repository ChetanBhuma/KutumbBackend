"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = exports.updateUser = exports.updateUserStatus = exports.updateUserRole = exports.listUsers = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const passwordService_1 = require("../services/passwordService");
const pagination_1 = require("../utils/pagination");
const queryBuilder_1 = require("../utils/queryBuilder");
const listUsers = async (req, res) => {
    try {
        const { search, role, status, } = req.query;
        const where = {};
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
        }
        else if (status === 'inactive') {
            where.isActive = false;
        }
        // Fetch roles separately for mapping
        const roles = await prisma_1.default.role.findMany({
            include: {
                permissions: true
            }
        });
        const roleMap = roles.reduce((acc, roleItem) => {
            acc[roleItem.code] = {
                ...roleItem,
                permissions: roleItem.permissions.map(p => p.code)
            };
            return acc;
        }, {});
        const result = await (0, pagination_1.paginatedQuery)(prisma_1.default.user, {
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
                officerProfile: {
                    // In updateUser (line 182) it uses `include: { officerProfile: true }`.
                    // However, in my verify script I used `beatOfficer`.
                    // Let's check `userController.ts` updateUser again.
                    // Line 182: `include: { officerProfile: true }`.
                    // Wait, in `updateUser` snippet: `if (existing.officerProfile)`.
                    // So the relation name is `officerProfile`. I will use `officerProfile`.
                    select: {
                        id: true,
                        rank: true,
                        name: true,
                        badgeNumber: true,
                        SubDivision: { select: { id: true, name: true } },
                        District: { select: { id: true, name: true } },
                        Range: { select: { id: true, name: true } },
                        PoliceStation: { select: { id: true, name: true } },
                        Beat: { select: { id: true, name: true } },
                    }
                }
            },
            orderBy: (0, queryBuilder_1.buildOrderBy)(req.query, { createdAt: 'desc' })
        });
        // Transform items
        const transformedItems = result.items.map((user) => {
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
    }
    catch (error) {
        console.error('List users error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching users',
        });
    }
};
exports.listUsers = listUsers;
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { roleCode } = req.body;
        if (!roleCode) {
            return res.status(400).json({
                success: false,
                message: 'roleCode is required',
            });
        }
        const role = await prisma_1.default.role.findUnique({
            where: { code: roleCode },
        });
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found',
            });
        }
        const user = await prisma_1.default.user.update({
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
        return res.json({
            success: true,
            data: user,
            message: 'User role updated successfully',
        });
    }
    catch (error) {
        console.error('Update user role error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating user role',
        });
    }
};
exports.updateUserRole = updateUserRole;
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isActive boolean is required',
            });
        }
        const user = await prisma_1.default.user.update({
            where: { id },
            data: { isActive },
        });
        return res.json({
            success: true,
            data: user,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        });
    }
    catch (error) {
        console.error('Update user status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating user status',
        });
    }
};
exports.updateUserStatus = updateUserStatus;
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, phone } = req.body;
        const existing = await prisma_1.default.user.findUnique({
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
        const updatedUser = await prisma_1.default.$transaction(async (tx) => {
            const user = await tx.user.update({
                where: { id },
                data: {
                    email: email || undefined,
                    phone: phone || undefined
                }
            });
            if (existing.officerProfile) {
                const officerUpdateData = {};
                if (email)
                    officerUpdateData.email = email;
                if (phone)
                    officerUpdateData.mobileNumber = phone;
                if (Object.keys(officerUpdateData).length > 0) {
                    await tx.beatOfficer.update({
                        where: { id: existing.officerProfile.id },
                        data: officerUpdateData
                    });
                }
            }
            return user;
        });
        return res.json({
            success: true,
            data: updatedUser,
            message: 'User updated successfully',
        });
    }
    catch (error) {
        console.error('Update user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating user',
        });
    }
};
exports.updateUser = updateUser;
const createUser = async (req, res) => {
    try {
        const { email, phone, password, roleCode, name, badgeNumber, jurisdiction } = req.body;
        if (!email || !phone || !roleCode) {
            return res.status(400).json({
                success: false,
                message: 'email, phone, and roleCode are required',
            });
        }
        const role = await prisma_1.default.role.findUnique({
            where: { code: roleCode },
        });
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found',
            });
        }
        const existing = await prisma_1.default.user.findFirst({
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
        const passwordHash = await passwordService_1.PasswordService.hash(passwordToUse);
        const result = await prisma_1.default.$transaction(async (tx) => {
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
                        managedRanges: { connect: rangeIds.map((id) => ({ id })) },
                        managedDistricts: { connect: districtIds.map((id) => ({ id })) },
                        managedSubDivisions: { connect: subDivisionIds.map((id) => ({ id })) },
                        managedPoliceStations: { connect: policeStationIds.map((id) => ({ id })) },
                        managedBeats: { connect: beatIds.map((id) => ({ id })) },
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
        return res.status(201).json({
            success: true,
            data: {
                ...result.user,
                officerProfile: result.officer,
                tempPassword: password ? undefined : passwordToUse,
            },
            message: 'User created successfully',
        });
    }
    catch (error) {
        console.error('Create user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating user',
        });
    }
};
exports.createUser = createUser;
//# sourceMappingURL=userController.js.map