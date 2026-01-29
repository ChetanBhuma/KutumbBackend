import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api/v1'; // Backend API with version prefix

async function testAuthFlow() {
    console.log('🚀 Starting Auth Flow Verification...');

    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const testUser = {
        email: `test_${Date.now()}@example.com`,
        phone: `9876${timestamp}`, // Valid Indian phone: 9876 + 6 digits = 10 total
        password: 'TestPassword@123',
        role: 'CITIZEN'
    };

    try {
        // 1. Register
        console.log('\n1️⃣ Testing Registration...');
        const registerRes = await axios.post(`${API_URL}/auth/register`, testUser);
        console.log('✅ Registration successful:', registerRes.data.success);

        if (!registerRes.data.success) throw new Error('Registration failed');

        // 2. Login
        console.log('\n2️⃣ Testing Login...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            identifier: testUser.email,
            password: testUser.password
        });
        console.log('✅ Login successful:', loginRes.data.success);

        const { accessToken, refreshToken } = loginRes.data.data.tokens;
        if (!accessToken) throw new Error('No access token received');

        // 3. Get Profile (Me)
        console.log('\n3️⃣ Testing Profile Fetch (Me)...');
        const meRes = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        console.log('✅ Profile fetch successful:', meRes.data.success);
        console.log('   User Role:', meRes.data.data.user.role);

        // 4. Refresh Token
        console.log('\n4️⃣ Testing Token Refresh...');
        const refreshRes = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken
        });
        console.log('✅ Token refresh successful:', refreshRes.data.success);
        const newAccessToken = refreshRes.data.data.accessToken;

        // 5. Logout
        console.log('\n5️⃣ Testing Logout...');
        const logoutRes = await axios.post(`${API_URL}/auth/logout`, {}, {
            headers: { Authorization: `Bearer ${newAccessToken}` }
        });
        console.log('✅ Logout successful:', logoutRes.data.success);

        console.log('\n🎉 All Auth tests passed!');

    } catch (error: any) {
        console.error('❌ Test Failed:', error.response?.data || error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testAuthFlow();
