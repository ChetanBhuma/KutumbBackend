export enum Role {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    OFFICER = 'OFFICER',
    SUPERVISOR = 'SUPERVISOR',
    CITIZEN = 'CITIZEN',
    VIEWER = 'VIEWER',
    CONTROL_ROOM = 'CONTROL_ROOM',
    DATA_ENTRY = 'DATA_ENTRY'
}

export enum Permission {
    // Citizens
    CITIZENS_READ = 'citizens.read',
    CITIZENS_WRITE = 'citizens.write',
    CITIZENS_DELETE = 'citizens.delete',

    // Officers
    OFFICERS_READ = 'officers.read',
    OFFICERS_WRITE = 'officers.write',
    OFFICERS_DELETE = 'officers.delete',
    OFFICERS_MANAGE = 'officers.manage',

    // Visits
    VISITS_READ = 'visits.read',
    VISITS_SCHEDULE = 'visits.schedule',
    VISITS_COMPLETE = 'visits.complete',
    VISITS_DELETE = 'visits.delete',

    // SOS
    SOS_READ = 'sos.read',
    SOS_RESPOND = 'sos.respond',
    SOS_RESOLVE = 'sos.resolve',

    // Reports
    REPORTS_READ = 'reports.read',
    REPORTS_GENERATE = 'reports.generate',
    REPORTS_EXPORT = 'reports.export',

    // System
    SYSTEM_SETTINGS = 'system.settings',
    AUDIT_LOGS = 'audit.logs',

    // Citizen Self-Service
    PROFILE_READ_OWN = 'profile.read.own',
    PROFILE_UPDATE_OWN = 'profile.update.own',
    VISITS_READ_OWN = 'visits.read.own',
    VISITS_REQUEST = 'visits.request',
    SOS_CREATE = 'sos.create',
    SOS_READ_OWN = 'sos.read.own',
    DOCUMENTS_UPLOAD = 'documents.upload',
    DOCUMENTS_READ_OWN = 'documents.read.own',
    FEEDBACK_SUBMIT = 'feedback.submit',
    NOTIFICATIONS_MANAGE = 'notifications.manage'
}

export const RolePermissions: Record<Role, Permission[]> = {
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
        Permission.SOS_RESPOND,
        Permission.REPORTS_READ,
        Permission.REPORTS_EXPORT
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
        Permission.DOCUMENTS_UPLOAD,
        Permission.REPORTS_EXPORT
    ]
};

export const hasPermission = (role: Role, permission: Permission): boolean => {
    return RolePermissions[role]?.includes(permission) || false;
};

export const hasAnyPermission = (role: Role, permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(role, permission));
};

export const hasAllPermissions = (role: Role, permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(role, permission));
};
