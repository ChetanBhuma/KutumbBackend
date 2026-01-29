const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';
const MOBILE = '9876543102';
const OTP = '123456';

async function testProfileUpdate() {
    try {
        let accessToken;

        console.log('1. Attempting Login via OTP...');
        try {
            await axios.post(`${BASE_URL}/citizen-auth/request-otp`, { mobileNumber: MOBILE });
            const loginResp = await axios.post(`${BASE_URL}/citizen-auth/verify-otp`, {
                mobileNumber: MOBILE,
                otp: OTP
            });
            accessToken = loginResp.data.data.tokens.accessToken;
            console.log('✅ Logged in via Standard Auth.');
        } catch (e) {
            console.log('Standard Login Failed (Not registered?):', e.response?.data?.message || e.message);

            // Fallback to Registration Flow
            console.log('1.1 Starting Registration...');
            try {
                const startResponse = await axios.post(`${BASE_URL}/citizen-portal/registrations/start`, {
                    mobileNumber: MOBILE,
                    fullName: "Test Citizen",
                    dateOfBirth: "1960-01-01"
                });
                const registrationId = startResponse.data.data.registration.id;
                console.log(`✅ Started. Reg ID: ${registrationId}`);

                console.log('1.2 Verifying Registration OTP...');
                const verifyResponse = await axios.post(`${BASE_URL}/citizen-portal/registrations/${registrationId}/verify-otp`, {
                    otp: OTP
                });
                accessToken = verifyResponse.data.data.accessToken;
                console.log('✅ Verified & Logged in via Registration.');
            } catch (regErr) {
                 console.error('❌ Registration Flow Failed:', regErr.response?.data || regErr.message);
                 return;
            }
        }

        if (!accessToken) {
             console.error('❌ No access token received');
             return;
        }

        console.log('3. Updating Profile (Test Valid Payload)...');
        const validPayload = {
             fullName: "Test Citizen Updated",
             dateOfBirth: "1960-01-01",
             gender: "Male",
             permanentAddress: "Test Address 123",
             pinCode: "110001",
             maritalStatus: "Married",
             nationality: "Indian",
             religion: "Hindu",
             // Add fields that might cause issues
             numberOfChildren: 2,
             yearOfRetirement: 2020,
             mobilityConstraints: "None",
             healthConditions: ["Diabetes"],
             bloodGroup: "O+"
        };

        try {
            const updateResponse = await axios.patch(`${BASE_URL}/citizen-profile/profile`, validPayload, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            console.log('✅ Valid Profile Update Success:', updateResponse.data.message);
        } catch (err) {
            console.error('❌ Valid Profile Update Failed:', err.response ? JSON.stringify(err.response.data, null, 2) : err.message);
        }

    } catch (error) {
        console.error('❌ Script Failed:', error);
    }
}

testProfileUpdate();
