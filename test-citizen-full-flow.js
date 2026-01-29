
const axios = require('axios');

async function testFullFlow() {
    let token;
    try {
        // 1. Login
        console.log('1. [Login] Attempting...');
        const loginRes = await axios.post('http://localhost:5000/api/v1/citizen-auth/login', {
            mobileNumber: '9876543230',
            password: 'Citizen@123'
        });
        token = loginRes.data.data.tokens.accessToken;
        console.log('   Success.');

        // 2. Profile Update
        console.log('2. [Profile] Updating Address...');
        await axios.patch(
            'http://localhost:5000/api/v1/citizen-profile/profile',
            { permanentAddress: 'Flow Check Address ' + Date.now() },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('   Success.');

        // 3. Get Visits
        console.log('3. [Visits] Fetching list...');
        const visitsRes = await axios.get(
            'http://localhost:5000/api/v1/citizen-profile/visits',
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`   Success. Found ${visitsRes.data.data.visits.length} visits.`);

        // 4. Request Visit
        console.log('4. [Visits] Requesting new visit...');
        await axios.post(
            'http://localhost:5000/api/v1/citizen-profile/visits/request',
            {
                visitType: 'Regular Checkup',
                preferredDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                notes: 'Automated flow check'
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('   Success.');

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

testFullFlow();
