export declare enum Role {
    SUPER_ADMIN = "SUPER_ADMIN",
    ADMIN = "ADMIN",
    OFFICER = "OFFICER",
    SUPERVISOR = "SUPERVISOR",
    CITIZEN = "CITIZEN",
    VIEWER = "VIEWER",
    CONTROL_ROOM = "CONTROL_ROOM",
    DATA_ENTRY = "DATA_ENTRY"
}
export declare enum Permission {
    CITIZENS_READ = "citizens.read",
    CITIZENS_WRITE = "citizens.write",
    CITIZENS_DELETE = "citizens.delete",
    OFFICERS_READ = "officers.read",
    OFFICERS_WRITE = "officers.write",
    OFFICERS_DELETE = "officers.delete",
    OFFICERS_MANAGE = "officers.manage",
    VISITS_READ = "visits.read",
    VISITS_SCHEDULE = "visits.schedule",
    VISITS_COMPLETE = "visits.complete",
    VISITS_DELETE = "visits.delete",
    SOS_READ = "sos.read",
    SOS_RESPOND = "sos.respond",
    SOS_RESOLVE = "sos.resolve",
    REPORTS_READ = "reports.read",
    REPORTS_GENERATE = "reports.generate",
    REPORTS_EXPORT = "reports.export",
    SYSTEM_SETTINGS = "system.settings",
    AUDIT_LOGS = "audit.logs",
    PROFILE_READ_OWN = "profile.read.own",
    PROFILE_UPDATE_OWN = "profile.update.own",
    VISITS_READ_OWN = "visits.read.own",
    VISITS_REQUEST = "visits.request",
    SOS_CREATE = "sos.create",
    SOS_READ_OWN = "sos.read.own",
    DOCUMENTS_UPLOAD = "documents.upload",
    DOCUMENTS_READ_OWN = "documents.read.own",
    FEEDBACK_SUBMIT = "feedback.submit",
    NOTIFICATIONS_MANAGE = "notifications.manage"
}
export declare const RolePermissions: Record<Role, Permission[]>;
export declare const hasPermission: (role: Role, permission: Permission) => boolean;
export declare const hasAnyPermission: (role: Role, permissions: Permission[]) => boolean;
export declare const hasAllPermissions: (role: Role, permissions: Permission[]) => boolean;
//# sourceMappingURL=auth.d.ts.map