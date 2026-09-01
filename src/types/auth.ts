export enum Role {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    COMMISSIONER = 'COMMISSIONER',
    SPECIAL_CP = 'SPECIAL_CP',
    JOINT_CP = 'JOINT_CP',
    DCP = 'DCP',
    ADDL_DCP = 'ADDL_DCP',
    ACP = 'ACP',
    INSPECTOR = 'INSPECTOR',
    SHO = 'SHO',
    SUB_INSPECTOR = 'SUB_INSPECTOR',
    SI = 'SI',
    ASST_SUB_INSPECTOR = 'ASST_SUB_INSPECTOR',
    ASI = 'ASI',
    HEAD_CONSTABLE = 'HEAD_CONSTABLE',
    CONSTABLE = 'CONSTABLE',
    BEAT_OFFICER = 'BEAT_OFFICER',
    OFFICER = 'OFFICER',
    SUPERVISOR = 'SUPERVISOR',
    CITIZEN = 'CITIZEN',
    VIEWER = 'VIEWER',
    CONTROL_ROOM = 'CONTROL_ROOM',
    DATA_ENTRY = 'DATA_ENTRY'
}

export enum Permission {
    // Dashboard
    DASHBOARD_ADMIN_VIEW = 'dashboard.admin.view',
    DASHBOARD_OFFICER_VIEW = 'dashboard.officer.view',
    DASHBOARD_CITIZEN_VIEW = 'dashboard.citizen.view',

    // Citizens
    CITIZENS_READ = 'citizens.read',
    CITIZENS_WRITE = 'citizens.write',
    CITIZENS_DELETE = 'citizens.delete',
    CITIZENS_APPROVE = 'citizens.approve',
    CITIZENS_MAP = 'citizens.map',
    CITIZENS_MAP_ALL = 'citizens.map.all',
    CITIZENS_MAP_PENDING = 'citizens.map.pending',

    // Officers
    OFFICERS_READ = 'officers.read',
    OFFICERS_WRITE = 'officers.write',
    OFFICERS_DELETE = 'officers.delete',
    OFFICERS_MANAGE = 'officers.manage',

    // Operations
    OPERATIONS = 'operations',
    OPERATIONS_JURISDICTION = 'operations.jurisdiction',
    OPERATIONS_ROSTER = 'operations.roster',

    // Visits
    VISITS_READ = 'visits.read',
    VISITS_SCHEDULE = 'visits.schedule',
    VISITS_COMPLETE = 'visits.complete',
    VISITS_DELETE = 'visits.delete',

    // SOS
    SOS_READ = 'sos.read',
    SOS_RESPOND = 'sos.respond',
    SOS_RESOLVE = 'sos.resolve',

    // Personnel
    PERSONNEL = 'personnel',
    PERSONNEL_HIERARCHY = 'personnel.hierarchy',

    // Reports & Analytics
    ANALYTICS = 'analytics',
    ANALYTICS_DASHBOARD = 'analytics.dashboard',
    REPORTS_READ = 'reports.read',
    REPORTS_GENERATE = 'reports.generate',
    REPORTS_EXPORT = 'reports.export',

    // Admin
    ADMIN = 'admin',
    ADMIN_USERS = 'admin.users',
    ADMIN_ROLES = 'admin.roles',
    ADMIN_PERMISSIONS = 'admin.permissions',
    ADMIN_MASTERS = 'admin.masters',

    // System
    SYSTEM = 'system',
    SYSTEM_SETTINGS = 'system.settings',
    AUDIT_LOGS = 'audit.logs',
    SYSTEM_BACKUPS = 'system.backups',

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
        Permission.DASHBOARD_ADMIN_VIEW,
        Permission.CITIZENS_READ,
        Permission.CITIZENS_WRITE,
        Permission.CITIZENS_APPROVE,
        Permission.CITIZENS_MAP,
        Permission.CITIZENS_MAP_ALL,
        Permission.CITIZENS_MAP_PENDING,
        Permission.OFFICERS_READ,
        Permission.OFFICERS_WRITE,
        Permission.OFFICERS_MANAGE,
        Permission.OPERATIONS,
        Permission.OPERATIONS_JURISDICTION,
        Permission.OPERATIONS_ROSTER,
        Permission.PERSONNEL,
        Permission.PERSONNEL_HIERARCHY,
        Permission.VISITS_READ,
        Permission.VISITS_SCHEDULE,
        Permission.VISITS_COMPLETE,
        Permission.SOS_READ,
        Permission.SOS_RESPOND,
        Permission.SOS_RESOLVE,
        Permission.ANALYTICS,
        Permission.ANALYTICS_DASHBOARD,
        Permission.REPORTS_READ,
        Permission.REPORTS_GENERATE,
        Permission.REPORTS_EXPORT,
        Permission.ADMIN,
        Permission.ADMIN_USERS,
        Permission.ADMIN_ROLES,
        Permission.ADMIN_MASTERS,
        Permission.SYSTEM,
        Permission.SYSTEM_SETTINGS,
        Permission.AUDIT_LOGS,
        Permission.NOTIFICATIONS_MANAGE
    ],

    [Role.COMMISSIONER]: [
        Permission.DASHBOARD_ADMIN_VIEW,
        Permission.CITIZENS_READ,
        Permission.CITIZENS_WRITE,
        Permission.CITIZENS_APPROVE,
        Permission.CITIZENS_MAP,
        Permission.CITIZENS_MAP_ALL,
        Permission.CITIZENS_MAP_PENDING,
        Permission.OFFICERS_READ,
        Permission.OFFICERS_WRITE,
        Permission.OFFICERS_MANAGE,
        Permission.OPERATIONS,
        Permission.OPERATIONS_JURISDICTION,
        Permission.OPERATIONS_ROSTER,
        Permission.PERSONNEL,
        Permission.PERSONNEL_HIERARCHY,
        Permission.VISITS_READ,
        Permission.VISITS_SCHEDULE,
        Permission.VISITS_COMPLETE,
        Permission.SOS_READ,
        Permission.SOS_RESPOND,
        Permission.SOS_RESOLVE,
        Permission.ANALYTICS,
        Permission.ANALYTICS_DASHBOARD,
        Permission.REPORTS_READ,
        Permission.REPORTS_GENERATE,
        Permission.REPORTS_EXPORT,
        Permission.SYSTEM_SETTINGS,
        Permission.AUDIT_LOGS
    ],

    [Role.SPECIAL_CP]: [
        Permission.DASHBOARD_ADMIN_VIEW,
        Permission.CITIZENS_READ,
        Permission.CITIZENS_WRITE,
        Permission.CITIZENS_APPROVE,
        Permission.CITIZENS_MAP,
        Permission.CITIZENS_MAP_ALL,
        Permission.OFFICERS_READ,
        Permission.OFFICERS_WRITE,
        Permission.OFFICERS_MANAGE,
        Permission.OPERATIONS,
        Permission.OPERATIONS_JURISDICTION,
        Permission.OPERATIONS_ROSTER,
        Permission.PERSONNEL,
        Permission.PERSONNEL_HIERARCHY,
        Permission.VISITS_READ,
        Permission.VISITS_SCHEDULE,
        Permission.VISITS_COMPLETE,
        Permission.SOS_READ,
        Permission.SOS_RESPOND,
        Permission.SOS_RESOLVE,
        Permission.ANALYTICS,
        Permission.ANALYTICS_DASHBOARD,
        Permission.REPORTS_READ,
        Permission.REPORTS_GENERATE,
        Permission.REPORTS_EXPORT
    ],

    [Role.JOINT_CP]: [
        Permission.DASHBOARD_ADMIN_VIEW,
        Permission.CITIZENS_READ,
        Permission.CITIZENS_WRITE,
        Permission.CITIZENS_APPROVE,
        Permission.CITIZENS_MAP,
        Permission.CITIZENS_MAP_ALL,
        Permission.OFFICERS_READ,
        Permission.OFFICERS_WRITE,
        Permission.OFFICERS_MANAGE,
        Permission.OPERATIONS,
        Permission.OPERATIONS_JURISDICTION,
        Permission.OPERATIONS_ROSTER,
        Permission.PERSONNEL,
        Permission.PERSONNEL_HIERARCHY,
        Permission.VISITS_READ,
        Permission.VISITS_SCHEDULE,
        Permission.VISITS_COMPLETE,
        Permission.SOS_READ,
        Permission.SOS_RESPOND,
        Permission.SOS_RESOLVE,
        Permission.ANALYTICS,
        Permission.ANALYTICS_DASHBOARD,
        Permission.REPORTS_READ,
        Permission.REPORTS_GENERATE,
        Permission.REPORTS_EXPORT
    ],

    [Role.DCP]: [
        Permission.DASHBOARD_ADMIN_VIEW,
        Permission.CITIZENS_READ,
        Permission.CITIZENS_WRITE,
        Permission.CITIZENS_APPROVE,
        Permission.CITIZENS_MAP,
        Permission.CITIZENS_MAP_ALL,
        Permission.OFFICERS_READ,
        Permission.OFFICERS_WRITE,
        Permission.OFFICERS_MANAGE,
        Permission.OPERATIONS,
        Permission.OPERATIONS_JURISDICTION,
        Permission.OPERATIONS_ROSTER,
        Permission.PERSONNEL,
        Permission.PERSONNEL_HIERARCHY,
        Permission.VISITS_READ,
        Permission.VISITS_SCHEDULE,
        Permission.VISITS_COMPLETE,
        Permission.SOS_READ,
        Permission.SOS_RESPOND,
        Permission.SOS_RESOLVE,
        Permission.ANALYTICS,
        Permission.ANALYTICS_DASHBOARD,
        Permission.REPORTS_READ,
        Permission.REPORTS_GENERATE,
        Permission.REPORTS_EXPORT
    ],

    [Role.ADDL_DCP]: [
        Permission.DASHBOARD_ADMIN_VIEW,
        Permission.CITIZENS_READ,
        Permission.CITIZENS_WRITE,
        Permission.CITIZENS_APPROVE,
        Permission.CITIZENS_MAP,
        Permission.CITIZENS_MAP_ALL,
        Permission.OFFICERS_READ,
        Permission.OFFICERS_WRITE,
        Permission.OFFICERS_MANAGE,
        Permission.OPERATIONS,
        Permission.OPERATIONS_JURISDICTION,
        Permission.OPERATIONS_ROSTER,
        Permission.PERSONNEL,
        Permission.PERSONNEL_HIERARCHY,
        Permission.VISITS_READ,
        Permission.VISITS_SCHEDULE,
        Permission.VISITS_COMPLETE,
        Permission.SOS_READ,
        Permission.SOS_RESPOND,
        Permission.SOS_RESOLVE,
        Permission.ANALYTICS,
        Permission.ANALYTICS_DASHBOARD,
        Permission.REPORTS_READ,
        Permission.REPORTS_GENERATE,
        Permission.REPORTS_EXPORT
    ],

    [Role.ACP]: [
        Permission.DASHBOARD_ADMIN_VIEW,
        Permission.CITIZENS_READ,
        Permission.CITIZENS_WRITE,
        Permission.CITIZENS_APPROVE,
        Permission.CITIZENS_MAP,
        Permission.CITIZENS_MAP_ALL,
        Permission.OFFICERS_READ,
        Permission.OFFICERS_WRITE,
        Permission.OFFICERS_MANAGE,
        Permission.OPERATIONS,
        Permission.OPERATIONS_JURISDICTION,
        Permission.OPERATIONS_ROSTER,
        Permission.PERSONNEL,
        Permission.PERSONNEL_HIERARCHY,
        Permission.VISITS_READ,
        Permission.VISITS_SCHEDULE,
        Permission.VISITS_COMPLETE,
        Permission.SOS_READ,
        Permission.SOS_RESPOND,
        Permission.SOS_RESOLVE,
        Permission.ANALYTICS,
        Permission.ANALYTICS_DASHBOARD,
        Permission.REPORTS_READ,
        Permission.REPORTS_GENERATE,
        Permission.REPORTS_EXPORT
    ],

    [Role.SHO]: [
        Permission.DASHBOARD_ADMIN_VIEW,
        Permission.DASHBOARD_OFFICER_VIEW,
        Permission.CITIZENS_READ,
        Permission.CITIZENS_WRITE,
        Permission.CITIZENS_APPROVE,
        Permission.CITIZENS_MAP,
        Permission.CITIZENS_MAP_ALL,
        Permission.CITIZENS_MAP_PENDING,
        Permission.OFFICERS_READ,
        Permission.OFFICERS_WRITE,
        Permission.OFFICERS_MANAGE,
        Permission.OPERATIONS,
        Permission.OPERATIONS_JURISDICTION,
        Permission.OPERATIONS_ROSTER,
        Permission.PERSONNEL,
        Permission.PERSONNEL_HIERARCHY,
        Permission.VISITS_READ,
        Permission.VISITS_SCHEDULE,
        Permission.VISITS_COMPLETE,
        Permission.SOS_READ,
        Permission.SOS_RESPOND,
        Permission.SOS_RESOLVE,
        Permission.ANALYTICS,
        Permission.ANALYTICS_DASHBOARD,
        Permission.REPORTS_READ,
        Permission.REPORTS_GENERATE
    ],

    [Role.INSPECTOR]: [
        Permission.DASHBOARD_ADMIN_VIEW,
        Permission.DASHBOARD_OFFICER_VIEW,
        Permission.CITIZENS_READ,
        Permission.CITIZENS_WRITE,
        Permission.CITIZENS_APPROVE,
        Permission.CITIZENS_MAP,
        Permission.CITIZENS_MAP_ALL,
        Permission.CITIZENS_MAP_PENDING,
        Permission.OFFICERS_READ,
        Permission.OFFICERS_WRITE,
        Permission.OFFICERS_MANAGE,
        Permission.OPERATIONS,
        Permission.OPERATIONS_JURISDICTION,
        Permission.OPERATIONS_ROSTER,
        Permission.PERSONNEL,
        Permission.PERSONNEL_HIERARCHY,
        Permission.VISITS_READ,
        Permission.VISITS_SCHEDULE,
        Permission.VISITS_COMPLETE,
        Permission.SOS_READ,
        Permission.SOS_RESPOND,
        Permission.SOS_RESOLVE,
        Permission.ANALYTICS,
        Permission.ANALYTICS_DASHBOARD,
        Permission.REPORTS_READ,
        Permission.REPORTS_GENERATE
    ],

    [Role.SUB_INSPECTOR]: [
        Permission.DASHBOARD_OFFICER_VIEW,
        Permission.CITIZENS_READ,
        Permission.CITIZENS_MAP,
        Permission.CITIZENS_MAP_ALL,
        Permission.VISITS_READ,
        Permission.VISITS_COMPLETE,
        Permission.SOS_READ,
        Permission.SOS_RESPOND,
        Permission.REPORTS_READ
    ],

    [Role.SI]: [
        Permission.DASHBOARD_OFFICER_VIEW,
        Permission.CITIZENS_READ,
        Permission.CITIZENS_MAP,
        Permission.CITIZENS_MAP_ALL,
        Permission.VISITS_READ,
        Permission.VISITS_COMPLETE,
        Permission.SOS_READ,
        Permission.SOS_RESPOND,
        Permission.REPORTS_READ
    ],

    [Role.ASST_SUB_INSPECTOR]: [
        Permission.DASHBOARD_OFFICER_VIEW,
        Permission.CITIZENS_READ,
        Permission.CITIZENS_MAP,
        Permission.CITIZENS_MAP_ALL,
        Permission.VISITS_READ,
        Permission.VISITS_COMPLETE,
        Permission.SOS_READ,
        Permission.SOS_RESPOND,
        Permission.REPORTS_READ
    ],

    [Role.ASI]: [
        Permission.DASHBOARD_OFFICER_VIEW,
        Permission.CITIZENS_READ,
        Permission.CITIZENS_MAP,
        Permission.CITIZENS_MAP_ALL,
        Permission.VISITS_READ,
        Permission.VISITS_COMPLETE,
        Permission.SOS_READ,
        Permission.SOS_RESPOND,
        Permission.REPORTS_READ
    ],

    [Role.HEAD_CONSTABLE]: [
        Permission.DASHBOARD_OFFICER_VIEW,
        Permission.CITIZENS_READ,
        Permission.CITIZENS_MAP,
        Permission.CITIZENS_MAP_ALL,
        Permission.VISITS_READ,
        Permission.VISITS_COMPLETE,
        Permission.SOS_READ,
        Permission.SOS_RESPOND,
        Permission.REPORTS_READ
    ],

    [Role.CONSTABLE]: [
        Permission.DASHBOARD_OFFICER_VIEW,
        Permission.CITIZENS_READ,
        Permission.CITIZENS_MAP,
        Permission.CITIZENS_MAP_ALL,
        Permission.VISITS_READ,
        Permission.VISITS_COMPLETE,
        Permission.SOS_READ,
        Permission.SOS_RESPOND,
        Permission.REPORTS_READ
    ],

    [Role.BEAT_OFFICER]: [
        Permission.DASHBOARD_OFFICER_VIEW,
        Permission.CITIZENS_READ,
        Permission.CITIZENS_MAP,
        Permission.CITIZENS_MAP_ALL,
        Permission.VISITS_READ,
        Permission.VISITS_COMPLETE,
        Permission.SOS_READ,
        Permission.SOS_RESPOND,
        Permission.REPORTS_READ
    ],

    [Role.OFFICER]: [
        Permission.DASHBOARD_OFFICER_VIEW,
        Permission.CITIZENS_READ,
        Permission.CITIZENS_MAP,
        Permission.CITIZENS_MAP_ALL,
        Permission.VISITS_READ,
        Permission.VISITS_COMPLETE,
        Permission.SOS_READ,
        Permission.SOS_RESPOND,
        Permission.REPORTS_READ,
        Permission.REPORTS_EXPORT
    ],

    [Role.SUPERVISOR]: [
        Permission.DASHBOARD_ADMIN_VIEW,
        Permission.CITIZENS_READ,
        Permission.CITIZENS_WRITE,
        Permission.CITIZENS_MAP,
        Permission.CITIZENS_MAP_ALL,
        Permission.VISITS_READ,
        Permission.VISITS_SCHEDULE,
        Permission.VISITS_COMPLETE,
        Permission.SOS_READ,
        Permission.SOS_RESPOND,
        Permission.SOS_RESOLVE,
        Permission.OPERATIONS,
        Permission.OPERATIONS_JURISDICTION,
        Permission.OPERATIONS_ROSTER,
        Permission.PERSONNEL,
        Permission.OFFICERS_READ,
        Permission.OFFICERS_WRITE,
        Permission.OFFICERS_MANAGE,
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
