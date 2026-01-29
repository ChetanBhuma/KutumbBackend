import { exit } from 'process';

const BASE_URL = 'http://127.0.0.1:5000/api/v1';

// Test Data
const RANDOM_SUFFIX = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
const CITIZEN_MOBILE = `+9199990${RANDOM_SUFFIX}`; // 10 digits + country code
const CITIZEN_NAME = `Test Citizen ${RANDOM_SUFFIX}`;
const ADMIN_EMAIL = 'admin@delhipolice.gov.in';
const ADMIN_PASSWORD = 'Admin@123';
const OFFICER_EMAIL = 'officer-range@delhipolice.gov.in';
const OFFICER_PASSWORD = 'Admin@123';

async function request(method: string, path: string, body?: any, token?: string) {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        const data = await res.json();
        return { status: res.status, data };
    } catch (e) {
        console.error(`Fetch failed for ${path}:`, e);
        return { status: 500, data: { success: false, message: 'Network error' } };
    }
}

async function main() {
    console.log('🚀 Starting End-to-End Verification...');
    console.log(`Test Citizen: ${CITIZEN_NAME} (${CITIZEN_MOBILE})`);

    // 1. Citizen Registration (Start)
    console.log('\nStep 1: Starting Registration...');
    // Endpoint: /citizen-portal/registrations/start
    const startReq = await request('POST', '/citizen-portal/registrations/start', {
        mobileNumber: CITIZEN_MOBILE,
        fullName: CITIZEN_NAME,
        dateOfBirth: '1960-01-01'
    });

    if (!startReq.data.success) {
        console.error('Failed to start registration:', startReq.data);
        exit(1);
    }
    const regData = startReq.data.data;
    const otp = regData.otp || regData.data?.otp; // Check structure
    const regId = regData.registration.id;

    if (!otp) {
        console.error('DEV OTP not returned. Ensure env is dev. Data:', regData);
        // If we can't get OTP, we can't proceed unless we check logs manually (impossible here).
        // But previously we saw 'devOtp' or 'otp' being returned.
        // CitizenPortalController lines 284-289: data: { registration, message, expiresAt, otp }
        // So regData should have .otp
        exit(1);
    }
    console.log(`Received OTP: ${otp} for Reg ID: ${regId}`);

    // 2. Verify OTP
    console.log('\nStep 2: Verifying OTP (Registration)...');
    // Endpoint: /citizen-portal/registrations/:id/verify-otp
    const verifyReq = await request('POST', `/citizen-portal/registrations/${regId}/verify-otp`, { otp });

    if (!verifyReq.data.success) {
        console.error('OTP Verification failed:', verifyReq.data);
        exit(1);
    }

    // Response structure from CitizenPortalController.verifyOTP (lines 391):
    // data: { accessToken, refreshToken, citizen, registrationId }
    const citizenToken = verifyReq.data.data.accessToken;
    console.log('Citizen Verified & Logged In.');

    // 3. Complete Profile (Submit Application)
    console.log('\nStep 3: Completing Profile...');
    const profilePayload = {
        fullName: CITIZEN_NAME,
        dateOfBirth: '1960-01-01',
        gender: 'Male',
        aadhaarNumber: `12${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`,
        permanentAddress: '123 Test Street, Delhi',
        pinCode: '110001',
        city: 'Delhi',
        mobileNumber: CITIZEN_MOBILE,
        healthConditions: ['Hypertension'],
        bloodGroup: 'O+',
        livingArrangement: 'Alone',
        emergencyContactName: 'Son Test',
        emergencyContactPhone: '9876543210',
        emergencyContactRelation: 'Son'
    };

    const updateReq = await request('PATCH', '/citizen-profile/profile', profilePayload, citizenToken);

    if (updateReq.status !== 200) {
        console.error('Profile Update Failed:', updateReq.data);
        exit(1);
    }
    console.log('Profile Completed. Application should now be PENDING_REVIEW (via Controller Trigger).');

    // 4. Admin Login
    console.log('\nStep 4: Admin Login...');
    const adminLogin = await request('POST', '/auth/login', { identifier: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    const adminToken = adminLogin.data.data?.tokens?.accessToken || adminLogin.data.data?.accessToken;
    if (!adminToken) {
        console.error('Admin Login Failed:', adminLogin.data);
        exit(1);
    }
    console.log('Admin Logged In.');

    // 5. Admin List Registrations
    console.log('\nStep 5: Admin Checking for Application...');
    const listReq = await request('GET', `/citizen-portal/registrations?status=PENDING_REVIEW&page=1&limit=50`, null, adminToken);

    if (!listReq.data.success) {
        console.error('List registrations failed:', JSON.stringify(listReq.data, null, 2));
        exit(1);
    }

    const registrations = listReq.data.data?.items || listReq.data.data?.registrations || listReq.data.data || [];
    console.log(`Found ${registrations.length} pending registrations`);
    const myReg = registrations.find((r: any) => r.mobileNumber === CITIZEN_MOBILE);

    if (!myReg) {
        console.error('Registration using mobile ' + CITIZEN_MOBILE + ' not found in pending list!');
        console.log('All found mobiles:', registrations.map((r: any) => r?.mobileNumber));
        exit(1);
    }
    console.log(`Found Pending Application: ${myReg.id}`);

    // 6. Schedule Visit
    console.log('\nStep 6: Admin Scheduling Visit...');
    // Finding officer
    const officerList = await request('GET', '/officers?page=1&limit=10', null, adminToken);
    const officers = officerList.data.data?.items || officerList.data.data || [];
    const officer = officers[0];

    if (!officer) {
        console.error('No officers found to assign!', officerList.data);
        exit(1);
    }
    console.log(`Assigning to Officer: ${officer.name} (${officer.id})`);

    const citizenId = myReg.citizenId || myReg.citizen?.id;

    const schedulePayload = {
        seniorCitizenId: citizenId,
        officerId: officer.id,
        scheduledDate: new Date(Date.now() + (10 + Math.floor(Math.random() * 20)) * 86400000).toISOString(), // Random 10-30 days ahead
        visitType: 'Verification',
        policeStationId: 'PS001'
    };

    const scheduleReq = await request('POST', '/visits', schedulePayload, adminToken);
    if (!scheduleReq.data.success) {
        console.error('Scheduling Failed:', scheduleReq.data);
        exit(1);
    }
    console.log('Schedule response:', JSON.stringify(scheduleReq.data.data, null, 2));
    const visitId = scheduleReq.data.data?.id || scheduleReq.data.data?.visit?.id;
    if (!visitId) {
        console.error('Visit ID not found in response!');
        exit(1);
    }
    console.log(`Visit Scheduled. ID: ${visitId}`);

    // 7. Officer Completes Visit
    console.log('\nStep 7: Officer Completing Visit...');
    // Use the assigned officer's email (from schedule response)
    const officerEmail = scheduleReq.data.data?.visit?.officer?.email || officer.email || OFFICER_EMAIL;
    console.log(`Logging in as officer: ${officerEmail}`);
    const officerLogin = await request('POST', '/auth/login', { identifier: officerEmail, password: OFFICER_PASSWORD });
    const officerToken = officerLogin.data.data?.tokens?.accessToken || officerLogin.data.data?.accessToken;
    if (!officerToken) {
        console.error('Officer Login Failed:', officerLogin.data);
        exit(1);
    }

    const visitStartReq = await request('POST', `/visits/${visitId}/start`, { latitude: 28.6139, longitude: 77.2090 }, officerToken);
    if (!visitStartReq.data.success) {
        console.error('Visit Start Failed (non-fatal if already started):', visitStartReq.data);
    }

    const completePayload = {
        gpsLatitude: 28.6139,
        gpsLongitude: 77.2090,
        riskScore: 10,
        notes: 'Citizen is verified.',
        assessmentData: { checklist: { safe: true } }
    };
    const completeReq = await request('POST', `/visits/${visitId}/officer-complete`, completePayload, officerToken);

    if (!completeReq.data.success) {
        console.error('Visit Completion Failed:', completeReq.data);
        exit(1);
    }
    console.log('Visit Completed.');

    // 8. Admin Final Approval
    console.log('\nStep 8: Admin Final Approval...');

    // Check if visit completion is reflected? (Optional)

    const approvePayload = {
        status: 'APPROVED',
        remarks: 'Verification successful. Approved.'
    };
    const approveReq = await request('PATCH', `/citizen-portal/registrations/${myReg.id}/status`, approvePayload, adminToken);

    if (!approveReq.data.success) {
        console.error('Approval Failed:', approveReq.data);
        exit(1);
    }
    console.log('Application APPROVED!');

    console.log('\n✅✅✅ END-TO-END VERIFICATION SUCCESSFUL! ✅✅✅');
}

main().catch(console.error);
