
import axios from 'axios';

async function testProfile() {
    try {
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:5000/api/v1/officer-app/auth/verify-otp', {
            badgeNumber: 'DCP-002',
            otp: '000000'
        });

        const token = loginRes.data.data.tokens.accessToken;
        console.log('Login Success. Token acquired.');

        console.log('Fetching Profile...');
        const profileRes = await axios.get('http://localhost:5000/api/v1/officer-app/profile', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Profile Fetch Success!');
        console.log('Officer Name:', profileRes.data.data.officer.name);

    } catch (error: any) {
        console.error('Test Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testProfile();
