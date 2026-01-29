
const axios = require('axios');

async function testLogin() {
    try {
        console.log('Attempting login...');
        const response = await axios.post('http://localhost:5000/api/v1/citizen-auth/login', {
            mobileNumber: '9876543230',
            password: 'Citizen@123'
        });
        console.log('Login Successful!');
        console.log('Status:', response.status);
        console.log('Token received:', !!response.data.data.tokens.accessToken);
        console.log('User Role:', response.data.data.citizen.role || 'CITIZEN');
    } catch (error) {
        console.error('Login Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testLogin();
