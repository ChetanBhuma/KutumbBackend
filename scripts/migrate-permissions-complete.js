"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var child_process_1 = require("child_process");
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
/**
 * ALL-IN-ONE Dynamic Permission System Migration
 *
 * This script handles the complete migration process:
 * 1. Backs up existing role permissions
 * 2. Creates permission categories and permissions
 * 3. Applies Prisma schema migration
 * 4. Links roles to new permissions
 * 5. Verifies the migration
 *
 * Run this script with: npm run migrate:permissions
 */
var prisma = new client_1.PrismaClient();
var categories = [
    { code: 'dashboard', name: 'Dashboard', description: 'Dashboard access permissions', icon: 'Home', displayOrder: 1 },
    { code: 'citizens', name: 'Citizens', description: 'Citizen management permissions', icon: 'Users', displayOrder: 2 },
    { code: 'visits', name: 'Visits', description: 'Visit management permissions', icon: 'ClipboardList', displayOrder: 3 },
    { code: 'operations', name: 'Operations', description: 'Operational permissions', icon: 'Shield', displayOrder: 4 },
    { code: 'personnel', name: 'Personnel', description: 'Personnel management permissions', icon: 'Users', displayOrder: 5 },
    { code: 'analytics', name: 'Analytics', description: 'Analytics and reporting permissions', icon: 'BarChart3', displayOrder: 6 },
    { code: 'admin', name: 'Admin', description: 'Administrative permissions', icon: 'Shield', displayOrder: 7 },
    { code: 'system', name: 'System', description: 'System configuration permissions', icon: 'Settings', displayOrder: 8 },
    { code: 'self_service', name: 'Self Service', description: 'Citizen self-service permissions', icon: 'User', displayOrder: 9 }
];
var permissions = [
    // Dashboard
    { code: 'dashboard.admin.view', name: 'View Admin Dashboard', categoryCode: 'dashboard', menuPath: '/admin/dashboard', menuLabel: 'Dashboard', menuIcon: 'Home', isMenuItem: true, displayOrder: 1 },
    { code: 'dashboard.officer.view', name: 'View Officer Dashboard', categoryCode: 'dashboard', menuPath: '/officer-app/dashboard', menuLabel: 'Officer Dashboard', menuIcon: 'Shield', isMenuItem: true, displayOrder: 2 },
    { code: 'dashboard.citizen.view', name: 'View Citizen Dashboard', categoryCode: 'dashboard', menuPath: '/citizen-portal/dashboard', menuLabel: 'Citizen Dashboard', menuIcon: 'User', isMenuItem: true, displayOrder: 3 },
    // Citizens
    { code: 'citizens.read', name: 'View Citizens', categoryCode: 'citizens', menuPath: '/citizens', menuLabel: 'Citizens', menuIcon: 'Users', isMenuItem: true, displayOrder: 1 },
    { code: 'citizens.write', name: 'Manage Citizens', categoryCode: 'citizens', isMenuItem: false, displayOrder: 2 },
    { code: 'citizens.delete', name: 'Delete Citizens', categoryCode: 'citizens', isMenuItem: false, displayOrder: 3 },
    { code: 'citizens.approve', name: 'Approve Registrations', categoryCode: 'citizens', menuPath: '/approvals', menuLabel: 'Registration Approvals', menuIcon: 'FileCheck', isMenuItem: true, displayOrder: 4 },
    { code: 'citizens.map', name: 'Citizen Map', categoryCode: 'citizens', menuLabel: 'Citizen Map', menuIcon: 'Map', isMenuItem: true, displayOrder: 5 },
    { code: 'citizens.map.all', name: 'All Citizens Map', categoryCode: 'citizens', menuPath: '/citizens/map', menuLabel: 'All Citizens', menuIcon: 'MapPin', isMenuItem: true, displayOrder: 1, parentCode: 'citizens.map' },
    { code: 'citizens.map.pending', name: 'Pending Verification Map', categoryCode: 'citizens', menuPath: '/citizens/map/pending', menuLabel: 'Pending Verification', menuIcon: 'AlertTriangle', isMenuItem: true, displayOrder: 2, parentCode: 'citizens.map' },
    // Visits
    { code: 'visits.read', name: 'View Visits', categoryCode: 'visits', menuPath: '/visits', menuLabel: 'Visits', menuIcon: 'ClipboardList', isMenuItem: true, displayOrder: 1 },
    { code: 'visits.schedule', name: 'Schedule Visits', categoryCode: 'visits', isMenuItem: false, displayOrder: 2 },
    { code: 'visits.complete', name: 'Complete Visits', categoryCode: 'visits', isMenuItem: false, displayOrder: 3 },
    { code: 'visits.delete', name: 'Delete Visits', categoryCode: 'visits', isMenuItem: false, displayOrder: 4 },
    // Operations
    { code: 'operations', name: 'Operations', categoryCode: 'operations', menuLabel: 'Operations', menuIcon: 'Shield', isMenuItem: true, displayOrder: 1 },
    { code: 'operations.jurisdiction', name: 'Jurisdiction Map', categoryCode: 'operations', menuPath: '/maps', menuLabel: 'Jurisdiction Map', menuIcon: 'MapPin', isMenuItem: true, displayOrder: 1, parentCode: 'operations' },
    { code: 'sos.read', name: 'View SOS Alerts', categoryCode: 'operations', menuPath: '/sos', menuLabel: 'SOS Alerts', menuIcon: 'Siren', isMenuItem: true, displayOrder: 2, parentCode: 'operations' },
    { code: 'sos.respond', name: 'Respond to SOS', categoryCode: 'operations', isMenuItem: false, displayOrder: 3 },
    { code: 'sos.resolve', name: 'Resolve SOS', categoryCode: 'operations', isMenuItem: false, displayOrder: 4 },
    { code: 'operations.roster', name: 'Duty Roster', categoryCode: 'operations', menuPath: '/roster', menuLabel: 'Duty Roster', menuIcon: 'CalendarDays', isMenuItem: true, displayOrder: 5, parentCode: 'operations' },
    // Personnel
    { code: 'personnel', name: 'Personnel', categoryCode: 'personnel', menuLabel: 'Personnel', menuIcon: 'Users', isMenuItem: true, displayOrder: 1 },
    { code: 'officers.read', name: 'View Officers', categoryCode: 'personnel', menuPath: '/officers', menuLabel: 'Officers', menuIcon: 'UserCog', isMenuItem: true, displayOrder: 1, parentCode: 'personnel' },
    { code: 'officers.write', name: 'Manage Officers', categoryCode: 'personnel', isMenuItem: false, displayOrder: 2 },
    { code: 'officers.delete', name: 'Delete Officers', categoryCode: 'personnel', isMenuItem: false, displayOrder: 3 },
    { code: 'officers.manage', name: 'Full Officer Management', categoryCode: 'personnel', isMenuItem: false, displayOrder: 4 },
    { code: 'personnel.hierarchy', name: 'View Hierarchy', categoryCode: 'personnel', menuPath: '/hierarchy', menuLabel: 'Hierarchy', menuIcon: 'GitGraph', isMenuItem: true, displayOrder: 5, parentCode: 'personnel' },
    // Analytics
    { code: 'analytics', name: 'Analytics', categoryCode: 'analytics', menuLabel: 'Analytics', menuIcon: 'BarChart3', isMenuItem: true, displayOrder: 1 },
    { code: 'reports.read', name: 'View Reports', categoryCode: 'analytics', menuPath: '/reports', menuLabel: 'Reports', menuIcon: 'FileBarChart', isMenuItem: true, displayOrder: 1, parentCode: 'analytics' },
    { code: 'reports.generate', name: 'Generate Reports', categoryCode: 'analytics', isMenuItem: false, displayOrder: 2 },
    { code: 'reports.export', name: 'Export Reports', categoryCode: 'analytics', isMenuItem: false, displayOrder: 3 },
    { code: 'analytics.dashboard', name: 'Analytics Dashboard', categoryCode: 'analytics', menuPath: '/analytics', menuLabel: 'Analytics', menuIcon: 'BarChart3', isMenuItem: true, displayOrder: 4, parentCode: 'analytics' },
    // Admin
    { code: 'admin', name: 'Admin', categoryCode: 'admin', menuLabel: 'Admin', menuIcon: 'Shield', isMenuItem: true, displayOrder: 1 },
    { code: 'admin.users', name: 'Manage Users', categoryCode: 'admin', menuPath: '/users', menuLabel: 'Users', menuIcon: 'Users', isMenuItem: true, displayOrder: 1, parentCode: 'admin' },
    { code: 'admin.roles', name: 'Manage Roles', categoryCode: 'admin', menuPath: '/admin/masters/roles', menuLabel: 'Roles', menuIcon: 'Shield', isMenuItem: true, displayOrder: 2, parentCode: 'admin' },
    { code: 'admin.permissions', name: 'Manage Permissions', categoryCode: 'admin', menuPath: '/admin/masters/permissions', menuLabel: 'Permissions', menuIcon: 'Key', isMenuItem: true, displayOrder: 3, parentCode: 'admin' },
    { code: 'admin.masters', name: 'Manage Masters', categoryCode: 'admin', menuPath: '/admin/masters', menuLabel: 'Masters', menuIcon: 'Database', isMenuItem: true, displayOrder: 4, parentCode: 'admin' },
    { code: 'notifications.manage', name: 'Manage Notifications', categoryCode: 'admin', menuPath: '/notifications', menuLabel: 'Notifications', menuIcon: 'Bell', isMenuItem: true, displayOrder: 5, parentCode: 'admin' },
    // System
    { code: 'system', name: 'System', categoryCode: 'system', menuLabel: 'System', menuIcon: 'Settings', isMenuItem: true, displayOrder: 1 },
    { code: 'system.settings', name: 'System Configuration', categoryCode: 'system', menuPath: '/settings', menuLabel: 'Config', menuIcon: 'Settings', isMenuItem: true, displayOrder: 1, parentCode: 'system' },
    { code: 'audit.logs', name: 'View Audit Logs', categoryCode: 'system', menuPath: '/audit', menuLabel: 'Audit', menuIcon: 'History', isMenuItem: true, displayOrder: 2, parentCode: 'system' },
    { code: 'system.backups', name: 'Manage Backups', categoryCode: 'system', menuPath: '/settings?tab=database', menuLabel: 'Backups', menuIcon: 'Database', isMenuItem: true, displayOrder: 3, parentCode: 'system' },
    // Self-Service (Citizen Portal)
    { code: 'profile.read.own', name: 'View Own Profile', categoryCode: 'self_service', isMenuItem: false, displayOrder: 1 },
    { code: 'profile.update.own', name: 'Update Own Profile', categoryCode: 'self_service', isMenuItem: false, displayOrder: 2 },
    { code: 'visits.read.own', name: 'View Own Visits', categoryCode: 'self_service', isMenuItem: false, displayOrder: 3 },
    { code: 'visits.request', name: 'Request Visits', categoryCode: 'self_service', isMenuItem: false, displayOrder: 4 },
    { code: 'sos.create', name: 'Create SOS Alert', categoryCode: 'self_service', isMenuItem: false, displayOrder: 5 },
    { code: 'sos.read.own', name: 'View Own SOS Alerts', categoryCode: 'self_service', isMenuItem: false, displayOrder: 6 },
    { code: 'documents.upload', name: 'Upload Documents', categoryCode: 'self_service', isMenuItem: false, displayOrder: 7 },
    { code: 'documents.read.own', name: 'View Own Documents', categoryCode: 'self_service', isMenuItem: false, displayOrder: 8 },
    { code: 'feedback.submit', name: 'Submit Feedback', categoryCode: 'self_service', isMenuItem: false, displayOrder: 9 }
];
// Role-Permission mapping
var rolePermissionMapping = {
    'SUPER_ADMIN': ['dashboard.admin.view', 'citizens.read', 'citizens.write', 'citizens.delete', 'citizens.approve', 'citizens.map', 'citizens.map.all', 'citizens.map.pending', 'visits.read', 'visits.schedule', 'visits.complete', 'visits.delete', 'operations', 'operations.jurisdiction', 'sos.read', 'sos.respond', 'sos.resolve', 'operations.roster', 'personnel', 'officers.read', 'officers.write', 'officers.delete', 'officers.manage', 'personnel.hierarchy', 'analytics', 'reports.read', 'reports.generate', 'reports.export', 'analytics.dashboard', 'admin', 'admin.users', 'admin.roles', 'admin.permissions', 'admin.masters', 'notifications.manage', 'system', 'system.settings', 'audit.logs', 'system.backups'],
    'ADMIN': ['dashboard.admin.view', 'citizens.read', 'citizens.write', 'citizens.approve', 'citizens.map', 'citizens.map.all', 'citizens.map.pending', 'visits.read', 'visits.schedule', 'visits.complete', 'operations', 'operations.jurisdiction', 'sos.read', 'sos.respond', 'sos.resolve', 'operations.roster', 'personnel', 'officers.read', 'officers.write', 'officers.manage', 'personnel.hierarchy', 'analytics', 'reports.read', 'reports.generate', 'reports.export', 'analytics.dashboard', 'admin', 'admin.users', 'admin.roles', 'admin.masters', 'notifications.manage', 'system', 'system.settings', 'audit.logs'],
    'OFFICER': ['dashboard.officer.view', 'citizens.read', 'citizens.map', 'citizens.map.all', 'visits.read', 'visits.complete', 'sos.read', 'sos.respond', 'reports.read'],
    'SUPERVISOR': ['dashboard.admin.view', 'citizens.read', 'citizens.write', 'citizens.map', 'citizens.map.all', 'visits.read', 'visits.schedule', 'visits.complete', 'sos.read', 'sos.respond', 'sos.resolve', 'officers.read', 'reports.read', 'reports.generate'],
    'CITIZEN': ['dashboard.citizen.view', 'profile.read.own', 'profile.update.own', 'visits.read.own', 'visits.request', 'sos.create', 'sos.read.own', 'documents.upload', 'documents.read.own', 'feedback.submit', 'notifications.manage'],
    'VIEWER': ['dashboard.admin.view', 'citizens.read', 'officers.read', 'visits.read', 'reports.read'],
    'CONTROL_ROOM': ['dashboard.admin.view', 'sos.read', 'sos.respond', 'sos.resolve', 'officers.read', 'citizens.read', 'visits.read'],
    'DATA_ENTRY': ['dashboard.admin.view', 'citizens.read', 'citizens.write', 'documents.upload']
};
// ============================================
// MIGRATION FUNCTIONS
// ============================================
function step1_BackupRolePermissions() {
    return __awaiter(this, void 0, void 0, function () {
        var roles, backup, backupPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n📦 STEP 1: Backing up existing role permissions...');
                    return [4 /*yield*/, prisma.role.findMany()];
                case 1:
                    roles = _a.sent();
                    backup = roles.map(function (role) { return ({
                        code: role.code,
                        name: role.name,
                        permissions: role.permissions
                    }); });
                    backupPath = path.join(__dirname, '../prisma/migrations/permission-backup.json');
                    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
                    console.log("\u2705 Backed up ".concat(backup.length, " roles to ").concat(backupPath));
                    return [2 /*return*/, backup];
            }
        });
    });
}
function step2_CreateCategories() {
    return __awaiter(this, void 0, void 0, function () {
        var createdCategories, _i, categories_1, category, created;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n📁 STEP 2: Creating permission categories...');
                    createdCategories = {};
                    _i = 0, categories_1 = categories;
                    _a.label = 1;
                case 1:
                    if (!(_i < categories_1.length)) return [3 /*break*/, 4];
                    category = categories_1[_i];
                    return [4 /*yield*/, prisma.permissionCategory.create({
                            data: category
                        })];
                case 2:
                    created = _a.sent();
                    createdCategories[category.code] = created;
                    console.log("  \u2713 ".concat(category.name));
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log("\u2705 Created ".concat(categories.length, " categories"));
                    return [2 /*return*/, createdCategories];
            }
        });
    });
}
function step3_CreatePermissions(createdCategories) {
    return __awaiter(this, void 0, void 0, function () {
        var createdPermissions, parentPermissions, _i, parentPermissions_1, permission, created, childPermissions, _a, childPermissions_1, permission, created;
        var _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    console.log('\n🔑 STEP 3: Creating permissions...');
                    createdPermissions = {};
                    parentPermissions = permissions.filter(function (p) { return !p.parentCode; });
                    _i = 0, parentPermissions_1 = parentPermissions;
                    _e.label = 1;
                case 1:
                    if (!(_i < parentPermissions_1.length)) return [3 /*break*/, 4];
                    permission = parentPermissions_1[_i];
                    return [4 /*yield*/, prisma.permission.create({
                            data: {
                                code: permission.code,
                                name: permission.name,
                                description: permission.description,
                                categoryId: (_b = createdCategories[permission.categoryCode]) === null || _b === void 0 ? void 0 : _b.id,
                                menuPath: permission.menuPath,
                                menuLabel: permission.menuLabel,
                                menuIcon: permission.menuIcon,
                                isMenuItem: permission.isMenuItem,
                                displayOrder: permission.displayOrder,
                                isActive: true
                            }
                        })];
                case 2:
                    created = _e.sent();
                    createdPermissions[permission.code] = created;
                    console.log("  \u2713 ".concat(permission.name));
                    _e.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    childPermissions = permissions.filter(function (p) { return p.parentCode; });
                    _a = 0, childPermissions_1 = childPermissions;
                    _e.label = 5;
                case 5:
                    if (!(_a < childPermissions_1.length)) return [3 /*break*/, 8];
                    permission = childPermissions_1[_a];
                    return [4 /*yield*/, prisma.permission.create({
                            data: {
                                code: permission.code,
                                name: permission.name,
                                description: permission.description,
                                categoryId: (_c = createdCategories[permission.categoryCode]) === null || _c === void 0 ? void 0 : _c.id,
                                parentId: (_d = createdPermissions[permission.parentCode]) === null || _d === void 0 ? void 0 : _d.id,
                                menuPath: permission.menuPath,
                                menuLabel: permission.menuLabel,
                                menuIcon: permission.menuIcon,
                                isMenuItem: permission.isMenuItem,
                                displayOrder: permission.displayOrder,
                                isActive: true
                            }
                        })];
                case 6:
                    created = _e.sent();
                    createdPermissions[permission.code] = created;
                    console.log("  \u2713 ".concat(permission.name, " (child of ").concat(permission.parentCode, ")"));
                    _e.label = 7;
                case 7:
                    _a++;
                    return [3 /*break*/, 5];
                case 8:
                    console.log("\u2705 Created ".concat(permissions.length, " permissions"));
                    return [2 /*return*/, createdPermissions];
            }
        });
    });
}
function step4_ApplyMigration() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            console.log('\n🔄 STEP 4: Applying Prisma schema migration...');
            try {
                (0, child_process_1.execSync)('npx prisma migrate deploy', {
                    cwd: path.join(__dirname, '..'),
                    stdio: 'inherit'
                });
                console.log('✅ Schema migration applied');
            }
            catch (error) {
                console.error('❌ Migration failed:', error);
                throw error;
            }
            return [2 /*return*/];
        });
    });
}
function step5_LinkRolePermissions(createdPermissions) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, _a, _b, roleCode, permissionCodes, role, permissionIds;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log('\n🔗 STEP 5: Linking roles to permissions...');
                    _i = 0, _a = Object.entries(rolePermissionMapping);
                    _c.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 5];
                    _b = _a[_i], roleCode = _b[0], permissionCodes = _b[1];
                    return [4 /*yield*/, prisma.role.findUnique({
                            where: { code: roleCode }
                        })];
                case 2:
                    role = _c.sent();
                    if (!role) {
                        console.log("  \u26A0\uFE0F  Role ".concat(roleCode, " not found, skipping..."));
                        return [3 /*break*/, 4];
                    }
                    permissionIds = permissionCodes
                        .map(function (code) { var _a; return (_a = createdPermissions[code]) === null || _a === void 0 ? void 0 : _a.id; })
                        .filter(Boolean);
                    return [4 /*yield*/, prisma.role.update({
                            where: { id: role.id },
                            data: {
                                permissions: {
                                    connect: permissionIds.map(function (id) { return ({ id: id }); })
                                }
                            }
                        })];
                case 3:
                    _c.sent();
                    console.log("  \u2713 ".concat(roleCode, ": ").concat(permissionIds.length, " permissions"));
                    _c.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 1];
                case 5:
                    console.log('✅ All roles linked to permissions');
                    return [2 /*return*/];
            }
        });
    });
}
function step6_Verify() {
    return __awaiter(this, void 0, void 0, function () {
        var categoryCount, permissionCount, rolesWithPermissions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n📊 STEP 6: Verifying migration...');
                    return [4 /*yield*/, prisma.permissionCategory.count()];
                case 1:
                    categoryCount = _a.sent();
                    return [4 /*yield*/, prisma.permission.count()];
                case 2:
                    permissionCount = _a.sent();
                    return [4 /*yield*/, prisma.role.findMany({
                            include: {
                                _count: {
                                    select: { permissions: true }
                                }
                            }
                        })];
                case 3:
                    rolesWithPermissions = _a.sent();
                    console.log("\n\u2705 Migration Summary:");
                    console.log("  - Categories: ".concat(categoryCount));
                    console.log("  - Permissions: ".concat(permissionCount));
                    console.log("  - Roles:");
                    rolesWithPermissions.forEach(function (role) {
                        console.log("    \u2022 ".concat(role.code, ": ").concat(role._count.permissions, " permissions"));
                    });
                    return [2 /*return*/];
            }
        });
    });
}
// ============================================
// MAIN EXECUTION
// ============================================
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var backup, createdCategories, createdPermissions, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🚀 Starting Dynamic Permission System Migration\n');
                    console.log('='.repeat(60));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, 9, 11]);
                    return [4 /*yield*/, step1_BackupRolePermissions()];
                case 2:
                    backup = _a.sent();
                    return [4 /*yield*/, step2_CreateCategories()];
                case 3:
                    createdCategories = _a.sent();
                    return [4 /*yield*/, step3_CreatePermissions(createdCategories)];
                case 4:
                    createdPermissions = _a.sent();
                    return [4 /*yield*/, step4_ApplyMigration()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, step5_LinkRolePermissions(createdPermissions)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, step6_Verify()];
                case 7:
                    _a.sent();
                    console.log('\n' + '='.repeat(60));
                    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
                    console.log('='.repeat(60));
                    console.log('\n📝 Next Steps:');
                    console.log('  1. Restart your backend server');
                    console.log('  2. Test permission system');
                    console.log('  3. Access Permission Master at /admin/masters/permissions');
                    console.log('');
                    return [3 /*break*/, 11];
                case 8:
                    error_1 = _a.sent();
                    console.error('\n❌ MIGRATION FAILED:', error_1);
                    console.log('\n📝 Rollback Instructions:');
                    console.log('  1. Stop the backend server');
                    console.log('  2. Run: npx prisma migrate reset');
                    console.log('  3. Restore from backup if needed');
                    process.exit(1);
                    return [3 /*break*/, 11];
                case 9: return [4 /*yield*/, prisma.$disconnect()];
                case 10:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
            }
        });
    });
}
main();
