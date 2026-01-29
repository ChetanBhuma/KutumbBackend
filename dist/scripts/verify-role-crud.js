"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const database_1 = require("../config/database");
const passwordService_1 = require("../services/passwordService");
const API_URL = 'http://localhost:5000/api/v1';
async function verifyRoleCRUD() {
    console.log(' Starting Role CRUD Verification...');
    // Generate random email and phone to avoid unique constraint issues
    const randId = Math.floor(1000 + Math.random() * 9000);
    const adminEmail = `verify_admin_${randId}@example.com`;
    const adminPassword = 'password123';
    const adminPhone = `99${Math.floor(10000000 + Math.random() * 90000000)}`;
    const testRoleCode = `TEST_CRUD_ROLE_${randId}`; // Unique role code too
    let adminToken = '';
    let createdRoleId = '';
    try {
        // --- PRE-CLEANUP ---
        // (Not strictly necessary with random IDs but good practice)
        // await prisma.user.deleteMany({ where: { email: adminEmail } });
        // Ensure SUPER_ADMIN role exists
        const superAdminRole = await database_1.prisma.role.findUnique({ where: { code: 'SUPER_ADMIN' } });
        if (!superAdminRole) {
            console.log(' SUPER_ADMIN role not found. Creating it...');
            await database_1.prisma.role.create({
                data: { code: 'SUPER_ADMIN', name: 'Super Admin', permissions: ['*'], isActive: true }
            });
        }
        // --- STEP 1: Create Admin User ---
        console.log(`\nStep 1: Creating Temporary Admin User (${adminEmail})...`);
        const passwordHash = await passwordService_1.PasswordService.hash(adminPassword);
        await database_1.prisma.user.create({
            data: {
                email: adminEmail,
                phone: adminPhone,
                passwordHash: passwordHash,
                role: 'SUPER_ADMIN',
                isActive: true
            }
        });
        console.log(' Admin User Created.');
        // --- STEP 2: Login ---
        console.log('\nStep 2: Logging in...');
        const loginRes = await axios_1.default.post(`${API_URL}/auth/login`, {
            identifier: adminEmail,
            password: adminPassword
        });
        adminToken = loginRes.data.data.tokens.accessToken;
        console.log(' Login Successful.');
        // --- STEP 3: CREATE Role (POST /roles) ---
        console.log('\nStep 3: Testing CREATE Role (POST /roles)...');
        const createRes = await axios_1.default.post(`${API_URL}/roles`, {
            code: testRoleCode,
            name: 'Test CRUD Role',
            description: 'Initial Description',
            permissions: ['citizens.read'],
            isActive: true
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        createdRoleId = createRes.data.data.id;
        console.log(`Role Created. ID: ${createdRoleId}`);
        if (createRes.data.data.code !== testRoleCode)
            throw new Error('Role Code mismatch');
        // --- STEP 3.1: Verify Duplicate Check (POST /roles) ---
        console.log('\nStep 3.1: Verifying Duplicate Creation (Should Fail with 409)...');
        try {
            await axios_1.default.post(`${API_URL}/roles`, {
                code: testRoleCode,
                name: 'Duplicate Role',
                permissions: [],
                isActive: true
            }, { headers: { Authorization: `Bearer ${adminToken}` } });
            throw new Error('Duplicate creation succeeded! Should have failed.');
        }
        catch (error) {
            if (error.response?.status === 409) {
                console.log('Duplicate correctly rejected (409 Conflict).');
                console.log('   Message:', error.response.data.message);
            }
            else {
                throw error;
            }
        }
        // --- STEP 4: READ Role (GET /roles/:id) ---
        console.log('\nStep 4: Testing READ Role (GET /roles/:id)...');
        const readRes = await axios_1.default.get(`${API_URL}/roles/${createdRoleId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
        console.log('Role Fetched.');
        if (readRes.data.data.name !== 'Test CRUD Role')
            throw new Error('Role Name mismatch');
        // --- STEP 5: UPDATE Role (PUT /roles/:id) ---
        console.log('\nStep 5: Testing UPDATE Role (PUT /roles/:id)...');
        const updateRes = await axios_1.default.put(`${API_URL}/roles/${createdRoleId}`, {
            name: 'Updated Role Name',
            description: 'Updated Description',
            permissions: ['citizens.read', 'citizens.write'],
            isActive: false
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        console.log(' Role Updated.');
        if (updateRes.data.data.name !== 'Updated Role Name')
            throw new Error('Update failed');
        if (!updateRes.data.data.permissions.includes('citizens.write'))
            throw new Error('Permissions update failed');
        // --- STEP 6: DELETE Role (DELETE /roles/:id) ---
        console.log('\nStep 6: Testing DELETE Role (DELETE /roles/:id)...');
        await axios_1.default.delete(`${API_URL}/roles/${createdRoleId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
        console.log(' Role Deleted.');
        // --- STEP 7: Verify Deletion ---
        console.log('\nStep 7: Verifying Deletion...');
        try {
            await axios_1.default.get(`${API_URL}/roles/${createdRoleId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
            throw new Error(' Role still exists after deletion!');
        }
        catch (error) {
            if (error.response?.status === 404) {
                console.log(' Role correctly Not Found (404).');
            }
            else {
                throw error;
            }
        }
        console.log('\n Role CRUD Verification PASSED!');
    }
    catch (error) {
        console.error('\n Verification FAILED:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
    finally {
        // --- CLEANUP ---
        console.log('\n Final Cleanup...');
        await database_1.prisma.user.deleteMany({ where: { email: adminEmail } });
        if (createdRoleId) {
            try {
                await database_1.prisma.role.delete({ where: { id: createdRoleId } });
            }
            catch (e) { }
        }
        console.log(' Cleanup complete.');
        process.exit();
    }
}
verifyRoleCRUD();
//# sourceMappingURL=verify-role-crud.js.map