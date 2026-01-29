
const axios = require('axios');

async function testFlow() {
    let token;
    try {
        // 1. Login
        console.log('1. Attempting Login...');
        const loginRes = await axios.post('http://localhost:5000/api/v1/citizen-auth/login', {
            mobileNumber: '9876543230',
            password: 'Citizen@123'
        });
        token = loginRes.data.data.tokens.accessToken;
        console.log('   Login Successful. Token acquired.');

        // 2. Update Profile (simulate address change to trigger VerificationRequest)
        console.log('2. Attempting Profile Update (Address Change)...');
        const updateRes = await axios.patch(
            'http://localhost:5000/api/v1/citizen-profile/profile',
            {
                permanentAddress: 'Test Address ' + Date.now(),
                policeStationId: loginRes.data.data.citizen.policeStationId // Keep same or change
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        console.log('   Profile Update Successful!');
        console.log('   Response:', updateRes.data.message);

    } catch (error) {
        console.error('Flow Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

testFlow();
