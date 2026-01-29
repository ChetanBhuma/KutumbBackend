const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

async function testOfficerLogin() {
    try {
        console.log('Testing Officer Login...');
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            identifier: 'officer1@delhipolice.gov.in',
            password: 'Officer@123'
        });

        console.log('✅ Login Successful!');
        console.log('User:', response.data.data.user);
        console.log('Token:', response.data.data.tokens.accessToken ? 'Present' : 'Missing');

    } catch (error) {
        console.error('❌ Login Failed:', error.response ? error.response.data : error.message);
    }
}

testOfficerLogin();
