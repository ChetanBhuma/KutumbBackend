"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasAllPermissions = exports.hasAnyPermission = exports.hasPermission = exports.RolePermissions = exports.Permission = exports.Role = void 0;
var Role;
(function (Role) {
    Role["SUPER_ADMIN"] = "SUPER_ADMIN";
    Role["ADMIN"] = "ADMIN";
    Role["OFFICER"] = "OFFICER";
    Role["SUPERVISOR"] = "SUPERVISOR";
    Role["CITIZEN"] = "CITIZEN";
    Role["VIEWER"] = "VIEWER";
    Role["CONTROL_ROOM"] = "CONTROL_ROOM";
    Role["DATA_ENTRY"] = "DATA_ENTRY";
})(Role || (exports.Role = Role = {}));
var Permission;
(function (Permission) {
    // Citizens
    Permission["CITIZENS_READ"] = "citizens.read";
    Permission["CITIZENS_WRITE"] = "citizens.write";
    Permission["CITIZENS_DELETE"] = "citizens.delete";
    // Officers
    Permission["OFFICERS_READ"] = "officers.read";
    Permission["OFFICERS_WRITE"] = "officers.write";
    Permission["OFFICERS_DELETE"] = "officers.delete";
    Permission["OFFICERS_MANAGE"] = "officers.manage";
    // Visits
    Permission["VISITS_READ"] = "visits.read";
    Permission["VISITS_SCHEDULE"] = "visits.schedule";
    Permission["VISITS_COMPLETE"] = "visits.complete";
    Permission["VISITS_DELETE"] = "visits.delete";
    // SOS
    Permission["SOS_READ"] = "sos.read";
    Permission["SOS_RESPOND"] = "sos.respond";
    Permission["SOS_RESOLVE"] = "sos.resolve";
    // Reports
    Permission["REPORTS_READ"] = "reports.read";
    Permission["REPORTS_GENERATE"] = "reports.generate";
    Permission["REPORTS_EXPORT"] = "reports.export";
    // System
    Permission["SYSTEM_SETTINGS"] = "system.settings";
    Permission["AUDIT_LOGS"] = "audit.logs";
    // Citizen Self-Service
    Permission["PROFILE_READ_OWN"] = "profile.read.own";
    Permission["PROFILE_UPDATE_OWN"] = "profile.update.own";
    Permission["VISITS_READ_OWN"] = "visits.read.own";
    Permission["VISITS_REQUEST"] = "visits.request";
    Permission["SOS_CREATE"] = "sos.create";
    Permission["SOS_READ_OWN"] = "sos.read.own";
    Permission["DOCUMENTS_UPLOAD"] = "documents.upload";
    Permission["DOCUMENTS_READ_OWN"] = "documents.read.own";
    Permission["FEEDBACK_SUBMIT"] = "feedback.submit";
    Permission["NOTIFICATIONS_MANAGE"] = "notifications.manage";
})(Permission || (exports.Permission = Permission = {}));
exports.RolePermissions = {
    [Role.SUPER_ADMIN]: Object.values(Permission),
    [Role.ADMIN]: [
        Permission.CITIZENS_READ,
        Permission.CITIZENS_WRITE,
        Permission.OFFICERS_READ,
        Permission.OFFICERS_WRITE,
        Permission.OFFICERS_MANAGE,
        Permission.VISITS_READ,
        Permission.VISITS_SCHEDULE,
        Permission.VISITS_COMPLETE,
        Permission.SOS_READ,
        Permission.SOS_RESPOND,
        Permission.SOS_RESOLVE,
        Permission.REPORTS_READ,
        Permission.REPORTS_GENERATE,
        Permission.REPORTS_EXPORT,
        Permission.SYSTEM_SETTINGS,
        Permission.AUDIT_LOGS,
        Permission.NOTIFICATIONS_MANAGE
    ],
    [Role.OFFICER]: [
        Permission.CITIZENS_READ,
        Permission.VISITS_READ,
        Permission.VISITS_COMPLETE,
        Permission.SOS_READ,
        Permission.SOS_RESPOND,
        Permission.REPORTS_READ
    ],
    [Role.SUPERVISOR]: [
        Permission.CITIZENS_READ,
        Permission.CITIZENS_WRITE,
        Permission.VISITS_READ,
        Permission.VISITS_SCHEDULE,
        Permission.VISITS_COMPLETE,
        Permission.SOS_READ,
        Permission.SOS_RESPOND,
        Permission.SOS_RESOLVE,
        Permission.OFFICERS_READ,
        Permission.REPORTS_READ,
        Permission.REPORTS_GENERATE
    ],
    [Role.CITIZEN]: [
        Permission.PROFILE_READ_OWN,
        Permission.PROFILE_UPDATE_OWN,
        Permission.VISITS_READ_OWN,
        Permission.VISITS_REQUEST,
        Permission.SOS_CREATE,
        Permission.SOS_READ_OWN,
        Permission.DOCUMENTS_UPLOAD,
        Permission.DOCUMENTS_READ_OWN,
        Permission.FEEDBACK_SUBMIT,
        Permission.NOTIFICATIONS_MANAGE
    ],
    [Role.VIEWER]: [
        Permission.CITIZENS_READ,
        Permission.OFFICERS_READ,
        Permission.VISITS_READ,
        Permission.REPORTS_READ
    ],
    [Role.CONTROL_ROOM]: [
        Permission.SOS_READ,
        Permission.SOS_RESPOND,
        Permission.SOS_RESOLVE,
        Permission.OFFICERS_READ,
        Permission.CITIZENS_READ,
        Permission.VISITS_READ
    ],
    [Role.DATA_ENTRY]: [
        Permission.CITIZENS_READ,
        Permission.CITIZENS_WRITE,
        Permission.DOCUMENTS_UPLOAD
    ]
};
const hasPermission = (role, permission) => {
    return exports.RolePermissions[role]?.includes(permission) || false;
};
exports.hasPermission = hasPermission;
const hasAnyPermission = (role, permissions) => {
    return permissions.some(permission => (0, exports.hasPermission)(role, permission));
};
exports.hasAnyPermission = hasAnyPermission;
const hasAllPermissions = (role, permissions) => {
    return permissions.every(permission => (0, exports.hasPermission)(role, permission));
};
exports.hasAllPermissions = hasAllPermissions;
//# sourceMappingURL=auth.js.map