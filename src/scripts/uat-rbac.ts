
import axios from 'axios';
import { prisma } from '../config/database';

const API_URL = 'http://localhost:5000/api/v1';

async function runUAT() {
    console.log('🚀 Starting User Acceptance Test (UAT) for RBAC...');

    const uatRoleCode = 'UAT_TESTER';
    const uatUserEmail = 'uat_tester@example.com';
    // Generate random phone to avoid unique constraint issues if cleanup fails
    const uatUserPhone = `90${Math.floor(10000000 + Math.random() * 90000000)}`;
    const uatUserPassword = 'password123';

    let uatToken = '';

    try {
        // --- PRE-CLEANUP ---
        console.log('\n🧹 Cleaning up previous test data...');
        await prisma.user.deleteMany({ where: { email: uatUserEmail } });
        await prisma.role.deleteMany({ where: { code: uatRoleCode } });
        console.log('✅ Cleanup complete.');

        // --- STEP 1: Create Mock Role (LIMITED ACCESS) ---
        console.log('\nStep 1: Creating Mock Role (UAT_TESTER) with LIMITED permissions...');
        await prisma.role.create({
            data: {
                code: uatRoleCode,
                name: 'UAT Tester',
                description: 'Role for UAT Verification',
                permissions: ['citizens.read'] // ONLY READ CITIZENS, NO VISITS
            }
        });
        console.log('✅ Role Created: [citizens.read]');

        // --- STEP 2: Create Mock User ---
        console.log(`\nStep 2: Creating Mock User (${uatUserEmail} / ${uatUserPhone})...`);
        const { PasswordService } = require('../services/passwordService');
        const passwordHash = await PasswordService.hash(uatUserPassword);

        try {
            await prisma.user.create({
                data: {
                    email: uatUserEmail,
                    phone: uatUserPhone,
                    passwordHash: passwordHash,
                    role: uatRoleCode,
                    isActive: true
                }
            });
            console.log('✅ User Created.');
        } catch (createError) {
            console.error('❌ User Create Failed:', createError);
            throw createError;
        }

        // --- STEP 3: Login to get Token (Verify Dynamic Permissions) ---
        console.log('\nStep 3: Logging in as UAT User...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            identifier: uatUserEmail,
            password: uatUserPassword
        });

        uatToken = loginRes.data.data.tokens.accessToken;
        const userPermissions = loginRes.data.data.user.permissions;
        console.log('🔹 Login Successful.');
        console.log('🔹 Received Permissions:', userPermissions);

        if (!userPermissions.includes('citizens.read') || userPermissions.includes('visits.read')) {
            throw new Error('❌ Initial Permission Mismatch! Login response did not reflect DB state.');
        }
        console.log('✅ Permissions Verified Correctly.');

        // --- STEP 4: Access Allowed Route ---
        console.log('\nStep 4: Testing ALLOWED Route (GET /citizens)...');
        try {
            await axios.get(`${API_URL}/citizens?limit=1`, {
                headers: { Authorization: `Bearer ${uatToken}` }
            });
            console.log('✅ Access Granted (200 OK) - CORRECT');
        } catch (error: any) {
            console.error('❌ Access Denied unexpectedly:', error.response?.status, error.response?.data);
            throw error;
        }

        // --- STEP 5: Access DENIED Route ---
        console.log('\nStep 5: Testing DENIED Route (GET /visits)...');
        try {
            await axios.get(`${API_URL}/visits?limit=1`, {
                headers: { Authorization: `Bearer ${uatToken}` }
            });
            console.error('❌ Access Granted unexpectedly! Should have been 403.');
            throw new Error('Security Breach: Denied route was accessible.');
        } catch (error: any) {
            if (error.response?.status === 403) {
                console.log('✅ Access Denied (403 Forbidden) - CORRECT');
            } else {
                console.error('❌ Unexpected Error:', error.response?.status);
                throw error;
            }
        }

        // --- STEP 6: Update Role in DB (Grant Access) ---
        console.log('\nStep 6: Updating Role in DB (Adding visits.read)...');
        await prisma.role.update({
            where: { code: uatRoleCode },
            data: { permissions: ['citizens.read', 'visits.read'] } // Grant Access
        });
        console.log('✅ Role Updated in DB.');

        // --- STEP 7: Re-Login / Access Previously Denied Route ---
        console.log('\nStep 7: Re-Logging in to sync permissions...');
        const reloginRes = await axios.post(`${API_URL}/auth/login`, {
            identifier: uatUserEmail,
            password: uatUserPassword
        });
        uatToken = reloginRes.data.data.tokens.accessToken;
        const newPermissions = reloginRes.data.data.user.permissions;
        console.log('🔹 New Permissions:', newPermissions);

        if (!newPermissions.includes('visits.read')) {
             throw new Error('❌ DB Update not reflected in new Token!');
        }

        console.log('Testing Previously DENIED Route (GET /visits)...');
        try {
            await axios.get(`${API_URL}/visits?limit=1`, {
                headers: { Authorization: `Bearer ${uatToken}` }
            });
            console.log('✅ Access Granted (200 OK) - CORRECT');
        } catch (error: any) {
            console.error('❌ Access still Denied or Error:', error.response?.status, error.response?.data);
            throw error;
        }

        console.log('\n🎉 UAT PASSED: Dynamic RBAC is fully functional!');

    } catch (error: any) {
        console.error('\n❌ UAT FAILED:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    } finally {
        // --- CLEANUP ---
        console.log('\n🧹 Final Cleanup...');
        await prisma.user.deleteMany({ where: { email: uatUserEmail } });
        await prisma.role.deleteMany({ where: { code: uatRoleCode } });
        console.log('✅ Cleanup complete.');
        process.exit();
    }
}

runUAT();
