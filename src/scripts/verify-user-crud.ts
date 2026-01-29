
import axios from 'axios';
import { prisma } from '../config/database';
import { PasswordService } from '../services/passwordService';

const API_URL = 'http://localhost:5000/api/v1';

async function verifyUserCRUD() {
    console.log('🚀 Starting User CRUD Verification...');

    // Generate random identifiers to avoid conflicts
    const randId = Math.floor(1000 + Math.random() * 9000);
    const adminEmail = `verify_admin_user_${randId}@example.com`;
    const adminPassword = 'password123';
    const adminPhone = `99${Math.floor(10000000 + Math.random() * 90000000)}`;

    // User to be created/manipulated
    const targetUserEmail = `target_user_${randId}@example.com`;
    const targetUserPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const roleCode = 'OFFICER'; // Assuming this role exists
    const newRoleCode = 'CITIZEN';

    let adminToken = '';
    let targetUserId = '';

    try {
        // --- PRE-CONFIGURATION ---
        // Ensure roles exist
        const officerRole = await prisma.role.findUnique({ where: { code: roleCode } });
        if (!officerRole) {
             console.log(`⚠️ ${roleCode} role not found. Creating it...`);
             await prisma.role.create({ data: { code: roleCode, name: 'Officer', permissions: [], isActive: true } });
        }

        // --- STEP 1: Create Admin User (for auth) ---
        console.log(`\nStep 1: Creating Temporary Admin User (${adminEmail})...`);
        const passwordHash = await PasswordService.hash(adminPassword);

        await prisma.user.create({
            data: {
                email: adminEmail,
                phone: adminPhone,
                passwordHash: passwordHash,
                role: 'SUPER_ADMIN',
                isActive: true
            }
        });

        // --- STEP 2: Login ---
        console.log('\nStep 2: Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            identifier: adminEmail,
            password: adminPassword
        });
        adminToken = loginRes.data.data.tokens.accessToken;
        console.log('✅ Login Successful.');

        // --- STEP 3: CREATE User (POST /users) ---
        console.log('\nStep 3: Testing CREATE User (POST /users)...');
        try {
            const createRes = await axios.post(
                `${API_URL}/users`,
                {
                    email: targetUserEmail,
                    phone: targetUserPhone,
                    roleCode: roleCode,
                    password: 'TargetUserPass123'
                },
                { headers: { Authorization: `Bearer ${adminToken}` } }
            );
            targetUserId = createRes.data.data.id;
            console.log(`✅ User Created. ID: ${targetUserId}`);
            console.log(`   Role: ${createRes.data.data.role}`);

            if (createRes.data.data.role !== roleCode) throw new Error(`Role mismatch. Expected ${roleCode}, got ${createRes.data.data.role}`);

        } catch (error: any) {
            console.error('❌ Create User Failed:', error.response?.data || error.message);
            throw error;
        }

        // --- STEP 4: LIST Users (GET /users) ---
        console.log('\nStep 4: Testing LIST Users (GET /users)...');
        const listRes = await axios.get(
            `${API_URL}/users?search=${targetUserEmail}`,
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        const users = listRes.data.data.users;
        const foundUser = users.find((u: any) => u.id === targetUserId);

        if (!foundUser) throw new Error('Created user not found in list');
        console.log('✅ User found in list.');

        // --- STEP 5: UPDATE User Role (PUT /users/:id/role) ---
        console.log('\nStep 5: Testing UPDATE User Role (PUT /users/:id/role)...');
        try {
            const updateRes = await axios.put(
                `${API_URL}/users/${targetUserId}/role`,
                { roleCode: newRoleCode },
                { headers: { Authorization: `Bearer ${adminToken}` } }
            );

            if (updateRes.data.data.role !== newRoleCode) throw new Error('Role update failed in response');

            // Verify in DB/List
            const verifyRes = await axios.get(
                `${API_URL}/users?search=${targetUserEmail}`,
                { headers: { Authorization: `Bearer ${adminToken}` } }
            );
            const verifiedUser = verifyRes.data.data.users.find((u: any) => u.id === targetUserId);
            if (verifiedUser.role !== newRoleCode) throw new Error('Role update not reflected in list');

            console.log(`✅ User Role Updated to ${newRoleCode}.`);

        } catch (error: any) {
             console.error('❌ Update Role Failed:', error.response?.data || error.message);
             throw error;
        }

        // --- STEP 6: VERIFY Access Control (Optional - simplistic check) ---
        // Login as the new user and check permissions/role in token?
        // Skipping for now, focusing on CRUD.

        console.log('\n🎉 User CRUD Verification PASSED!');

    } catch (error: any) {
        console.error('\n❌ Verification FAILED:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    } finally {
        // --- CLEANUP ---
        console.log('\n🧹 Final Cleanup...');
        await prisma.user.deleteMany({ where: { email: { in: [adminEmail, targetUserEmail] } } });
        console.log('✅ Cleanup complete.');
        process.exit();
    }
}

verifyUserCRUD();
