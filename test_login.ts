
import axios from 'axios';

async function testLogin() {
    try {
        const payload = {
            badgeNumber: 'DCP-002',
            otp: '000000'
        };

        console.log('Attempting login with:', payload);
        const response = await axios.post('http://localhost:5000/api/v1/officer-app/auth/verify-otp', payload);

        console.log('Login Success!');
        console.log('Status:', response.status);
        console.log('User Role:', response.data.data.user.role);
        console.log('Officer Name:', response.data.data.user.officerProfile?.name);

    } catch (error: any) {
        console.error('Login Failed:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
        }
    }
}

testLogin();
