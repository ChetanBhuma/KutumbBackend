
const axios = require('axios');

async function testOtpFlow(mobileNumber) {
    try {
        console.log(`\nTesting OTP Flow for Mobile: ${mobileNumber}`);

        // 1. Request OTP
        console.log('1. [OTP Request] Initiating...');
        const requestRes = await axios.post('http://localhost:5000/api/v1/citizen-auth/request-otp', {
            mobileNumber: mobileNumber
        });

        console.log('   Success.');

        // In local/dev environment, the OTP typically returned in response or logs.
        // For this test script, we'll assume the mock OTP '000000' or capture from response if available.
        let otp = '000000';
        if (requestRes.data.data && requestRes.data.data.devOtp) {
            otp = requestRes.data.data.devOtp;
            console.log(`   [DEV] Captured OTP from response: ${otp}`);
        } else if (requestRes.data.otp) {
             otp = requestRes.data.otp;
             console.log(`   [DEV] Captured OTP from root response: ${otp}`);
        } else {
             console.log(`   [INFO] Using default mock OTP: ${otp}`);
        }

        // 2. Verify OTP
        console.log(`2. [OTP Verify] Verifying with code: ${otp}...`);
        const verifyRes = await axios.post('http://localhost:5000/api/v1/citizen-auth/verify-otp', {
            mobileNumber: mobileNumber,
            otp: otp
        });

        const token = verifyRes.data.data.tokens.accessToken;
        console.log('   Success. Login Verified.');

        // 3. Verify Session (Get Profile)
        console.log('3. [Session] Fetching Profile...');
        const profileRes = await axios.get(
            'http://localhost:5000/api/v1/citizen-profile/profile',
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`   Success. Hello, ${profileRes.data.data.citizen.fullName}!`);

    } catch (error) {
        console.error('OTP Flow Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

// Run for existing citizen
testOtpFlow('9876543230');
