
import { Role, Permission, RolePermissions, hasPermission } from './src/types/auth';

console.log('--- Auth Type Test ---');
console.log('Role.ADMIN:', Role.ADMIN);
console.log('Permission.CITIZENS_WRITE:', Permission.CITIZENS_WRITE);

console.log('RolePermissions[Role.ADMIN]:', RolePermissions[Role.ADMIN] ? 'Exists' : 'Undefined');
if (RolePermissions[Role.ADMIN]) {
    console.log('Start of list:', RolePermissions[Role.ADMIN].slice(0, 3));
    console.log('Has citizens.write?', RolePermissions[Role.ADMIN].includes(Permission.CITIZENS_WRITE));
}

console.log('Check hasPermission("ADMIN", "citizens.write"):', hasPermission(Role.ADMIN, Permission.CITIZENS_WRITE));

// Test potential casing issues
const lowercaseAdmin = "admin" as Role;
console.log('Check hasPermission("admin", "citizens.write"):', hasPermission(lowercaseAdmin, Permission.CITIZENS_WRITE));

const mixedCaseAdmin = "Admin" as Role;
console.log('Check hasPermission("Admin", "citizens.write"):', hasPermission(mixedCaseAdmin, Permission.CITIZENS_WRITE));

console.log('--- End Test ---');
