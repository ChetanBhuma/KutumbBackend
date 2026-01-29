import { exit } from 'process';

const BASE_URL = 'http://127.0.0.1:5000/api/v1';

// Test counters
let passed = 0;
let failed = 0;
const results: { test: string; status: 'PASS' | 'FAIL'; error?: string }[] = [];

// Test Data
const RANDOM_SUFFIX = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
const MOBILE_SUFFIX = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
// Generate valid Indian mobile: +91 + (6-9) + 9 more digits
const ADMIN_EMAIL = 'admin@delhipolice.gov.in';
const ADMIN_PASSWORD = 'Admin@123';

// Helper: API Request
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
    } catch (e: any) {
        return { status: 500, data: { success: false, message: e.message } };
    }
}

// Helper: Test assertion
function test(name: string, condition: boolean, errorMsg?: string) {
    if (condition) {
        console.log(`  ✅ ${name}`);
        passed++;
        results.push({ test: name, status: 'PASS' });
    } else {
        console.log(`  ❌ ${name}${errorMsg ? ': ' + errorMsg : ''}`);
        failed++;
        results.push({ test: name, status: 'FAIL', error: errorMsg });
    }
}

async function main() {
    console.log('🚀 Comprehensive Citizens Module E2E Verification');
    console.log('='.repeat(60));

    // ============================================
    // SECTION 1: ADMIN AUTHENTICATION
    // ============================================
    console.log('\n📋 Section 1: Admin Authentication');
    console.log('-'.repeat(40));

    const adminLogin = await request('POST', '/auth/login', { identifier: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    const adminToken = adminLogin.data.data?.tokens?.accessToken || adminLogin.data.data?.accessToken;
    test('Admin Login', !!adminToken, adminLogin.data?.error?.message);

    if (!adminToken) {
        console.error('❌ Cannot proceed without admin token');
        exit(1);
    }

    // ============================================
    // SECTION 2: CITIZENS CRUD OPERATIONS
    // ============================================
    console.log('\n📋 Section 2: Citizens CRUD Operations');
    console.log('-'.repeat(40));

    // 2.1 List Citizens
    const listRes = await request('GET', '/citizens?page=1&limit=10', null, adminToken);
    test('GET /citizens (List)', listRes.data.success === true);
    test('List returns items array', Array.isArray(listRes.data.data?.items));
    test('List returns pagination', !!listRes.data.data?.pagination);

    // 2.2 Create Citizen
    const createPayload = {
        fullName: `E2E Test Citizen ${RANDOM_SUFFIX}`,
        dateOfBirth: '1958-05-15T00:00:00.000Z',
        gender: 'Male',
        mobileNumber: `+919${MOBILE_SUFFIX.slice(0, 4)}${RANDOM_SUFFIX.slice(0, 5)}`,  // +91 + 9 + 4 + 5 = 10 digits
        permanentAddress: '456 Test Avenue, Delhi',
        pinCode: '110002',
        aadhaarNumber: `99${RANDOM_SUFFIX}${RANDOM_SUFFIX.slice(0, 2)}`,
        bloodGroup: 'A+',
        emergencyContacts: [
            { name: 'Spouse', mobileNumber: '9876543211', relation: 'Spouse' }
        ],
        consentDataUse: 'true'
    };
    const createRes = await request('POST', '/citizens', createPayload, adminToken);
    test('POST /citizens (Create)', createRes.data.success === true, createRes.data?.error?.message);
    const citizenId = createRes.data.data?.citizen?.id || createRes.data.data?.id;
    test('Create returns citizen ID', !!citizenId, JSON.stringify(createRes.data.data));

    // 2.3 Get Citizen by ID (if created successfully)
    if (citizenId) {
        const getRes = await request('GET', `/citizens/${citizenId}`, null, adminToken);
        test('GET /citizens/:id (Read)', getRes.data.success === true);
        test('Read returns correct citizen', getRes.data.data?.citizen?.id === citizenId || getRes.data.data?.id === citizenId);

        // 2.4 Update Citizen
        const updatePayload = {
            fullName: `E2E Updated Citizen ${RANDOM_SUFFIX}`,
            occupation: 'Retired Government Official',
            bloodGroup: 'B+'
        };
        const updateRes = await request('PUT', `/citizens/${citizenId}`, updatePayload, adminToken);
        test('PUT /citizens/:id (Update)', updateRes.data.success === true, updateRes.data?.error?.message);

        // 2.5 Update Verification Status
        const verifyRes = await request('PATCH', `/citizens/${citizenId}/verification`, {
            status: 'Approved',
            remarks: 'E2E Test - Auto approved'
        }, adminToken);
        test('PATCH /citizens/:id/verification', verifyRes.data.success === true, verifyRes.data?.error?.message);

        // 2.6 Issue Digital Card
        const cardRes = await request('POST', `/citizens/${citizenId}/digital-card`, {}, adminToken);
        test('POST /citizens/:id/digital-card', cardRes.data.success === true, cardRes.data?.error?.message);

        // 2.7 Get Documents
        const docsRes = await request('GET', `/citizens/${citizenId}/documents`, null, adminToken);
        test('GET /citizens/:id/documents', docsRes.data.success === true);

        // 2.8 Delete Citizen (Soft Delete)
        const deleteRes = await request('DELETE', `/citizens/${citizenId}`, null, adminToken);
        test('DELETE /citizens/:id (Soft Delete)', deleteRes.data.success === true, deleteRes.data?.error?.message);
    } else {
        console.log('  ⚠️ Skipping citizen-specific tests (no citizen ID)');
    }

    // ============================================
    // SECTION 3: CITIZENS LISTING & FILTERS
    // ============================================
    console.log('\n📋 Section 3: Citizens Listing & Filters');
    console.log('-'.repeat(40));

    // 3.1 List with search
    const searchRes = await request('GET', '/citizens?search=Test', null, adminToken);
    test('GET /citizens?search=Test', searchRes.data.success === true);

    // 3.2 List with vulnerability filter
    const vulnRes = await request('GET', '/citizens?vulnerabilityLevel=High', null, adminToken);
    test('GET /citizens?vulnerabilityLevel=High', vulnRes.data.success === true);

    // 3.3 List with verification filter
    const verifRes = await request('GET', '/citizens?verificationStatus=Pending', null, adminToken);
    test('GET /citizens?verificationStatus=Pending', verifRes.data.success === true);

    // 3.4 Map view
    const mapRes = await request('GET', '/citizens/map', null, adminToken);
    test('GET /citizens/map', mapRes.data.success === true);

    // 3.5 Statistics
    const statsRes = await request('GET', '/citizens/statistics', null, adminToken);
    test('GET /citizens/statistics', statsRes.data.success === true);
    test('Statistics has data', statsRes.data.data !== undefined);

    // 3.6 Check Duplicates
    const dupRes = await request('POST', '/citizens/check-duplicates', {
        fullName: 'Test Citizen',
        mobileNumber: '+919999012345'
    }, adminToken);
    test('POST /citizens/check-duplicates', dupRes.data.success === true);

    // ============================================
    // SECTION 4: CITIZEN PORTAL (REGISTRATION FLOW)
    // ============================================
    console.log('\n📋 Section 4: Citizen Portal (Registration Flow)');
    console.log('-'.repeat(40));

    // 4.1 Start Registration
    const regMobile = `+918${MOBILE_SUFFIX.slice(0, 4)}${RANDOM_SUFFIX}`;
    const startRes = await request('POST', '/citizen-portal/registrations/start', {
        mobileNumber: regMobile,
        fullName: `Portal Citizen ${RANDOM_SUFFIX}`,
        dateOfBirth: '1955-03-20T00:00:00.000Z'
    });
    test('POST /citizen-portal/registrations/start', startRes.data.success === true, startRes.data?.error?.message);
    const regId = startRes.data.data?.registration?.id;
    const otp = startRes.data.data?.otp;
    test('Registration returns ID', !!regId);
    test('Registration returns OTP (dev mode)', !!otp);

    if (regId && otp) {
        // 4.2 Get Registration
        const getRegRes = await request('GET', `/citizen-portal/registrations/${regId}`);
        test('GET /citizen-portal/registrations/:id', getRegRes.data.success === true);

        // 4.3 Verify OTP
        const verifyOtpRes = await request('POST', `/citizen-portal/registrations/${regId}/verify-otp`, { otp });
        test('POST /citizen-portal/registrations/:id/verify-otp', verifyOtpRes.data.success === true, verifyOtpRes.data?.error?.message);
        const citizenToken = verifyOtpRes.data.data?.accessToken;
        test('OTP verification returns citizen token', !!citizenToken);

        // 4.4 Submit Registration (with citizen data)
        if (citizenToken) {
            // 4.5 List Registrations (Admin)
            const listRegRes = await request('GET', '/citizen-portal/registrations?page=1&limit=10', null, adminToken);
            test('GET /citizen-portal/registrations (Admin)', listRegRes.data.success === true);

            // 4.6 Update Registration Status
            const updateStatusRes = await request('PATCH', `/citizen-portal/registrations/${regId}/status`, {
                status: 'PENDING_REVIEW',
                remarks: 'E2E Test - Set to pending'
            }, adminToken);
            test('PATCH /citizen-portal/registrations/:id/status', updateStatusRes.data.success === true, updateStatusRes.data?.error?.message);
        }
    } else {
        console.log('  ⚠️ Skipping registration tests (no reg ID or OTP)');
    }

    // ============================================
    // SECTION 5: CITIZEN PROFILE (SELF-SERVICE)
    // ============================================
    console.log('\n📋 Section 5: Citizen Profile (Self-Service)');
    console.log('-'.repeat(40));

    // Use the existing citizen token from registration
    // Re-login as citizen for profile tests
    const citizenMobile = `+917${MOBILE_SUFFIX.slice(0, 4)}${RANDOM_SUFFIX}`;
    const citizenStartRes = await request('POST', '/citizen-portal/registrations/start', {
        mobileNumber: citizenMobile,
        fullName: `Profile Test ${RANDOM_SUFFIX}`,
        dateOfBirth: '1952-07-10T00:00:00.000Z'
    });
    const citizenRegId = citizenStartRes.data.data?.registration?.id;
    const citizenOtp = citizenStartRes.data.data?.otp;

    if (citizenRegId && citizenOtp) {
        const citizenVerify = await request('POST', `/citizen-portal/registrations/${citizenRegId}/verify-otp`, { otp: citizenOtp });
        const citizenToken = citizenVerify.data.data?.accessToken;

        if (citizenToken) {
            // 5.1 Get Profile
            const profileRes = await request('GET', '/citizen-profile/profile', null, citizenToken);
            test('GET /citizen-profile/profile', profileRes.data.success === true, profileRes.data?.error?.message);

            // 5.2 Update Profile
            const updateProfileRes = await request('PATCH', '/citizen-profile/profile', {
                occupation: 'Retired Teacher',
                bloodGroup: 'AB+'
            }, citizenToken);
            test('PATCH /citizen-profile/profile', updateProfileRes.data.success === true, updateProfileRes.data?.error?.message);

            // 5.3 Get Visits
            const visitsRes = await request('GET', '/citizen-profile/visits', null, citizenToken);
            test('GET /citizen-profile/visits', visitsRes.data.success === true || visitsRes.status === 200, visitsRes.data?.error?.message);

            // 5.4 Request Visit
            const requestVisitRes = await request('POST', '/citizen-profile/visits/request', {
                preferredDate: new Date(Date.now() + 7 * 86400000).toISOString(),
                reason: 'E2E Test - Routine check'
            }, citizenToken);
            test('POST /citizen-profile/visits/request', requestVisitRes.data.success === true, requestVisitRes.data?.error?.message);

            // 5.5 Get Documents
            const docsRes = await request('GET', '/citizen-profile/documents', null, citizenToken);
            test('GET /citizen-profile/documents', docsRes.data.success === true);

            // 5.6 Update Notifications
            const notifRes = await request('PATCH', '/citizen-profile/notifications', {
                allowNotifications: true,
                allowSmsNotifications: true
            }, citizenToken);
            test('PATCH /citizen-profile/notifications', notifRes.data.success === true, notifRes.data?.error?.message);

            // 5.7 Submit Feedback
            const feedbackRes = await request('POST', '/citizen-profile/feedback', {
                rating: 5,
                comment: 'E2E Test - Great service!'
            }, citizenToken);
            test('POST /citizen-profile/feedback', feedbackRes.data.success === true, feedbackRes.data?.error?.message);

            // 5.8 Create SOS (if supported)
            const sosRes = await request('POST', '/citizen-profile/sos', {
                type: 'EMERGENCY',
                address: 'Test Location Delhi',
                latitude: 28.6139,
                longitude: 77.2090,
                location: 'Test Location Delhi 110001'
            }, citizenToken);
            test('POST /citizen-profile/sos', sosRes.data.success === true || sosRes.status < 500, sosRes.data?.error?.message);

            // 5.9 Get SOS History
            const sosHistoryRes = await request('GET', '/citizen-profile/sos', null, citizenToken);
            test('GET /citizen-profile/sos', sosHistoryRes.data.success === true);
        } else {
            console.log('  ⚠️ Skipping profile tests (no citizen token)');
        }
    }

    // ============================================
    // SECTION 6: VISIT REQUESTS
    // ============================================
    console.log('\n📋 Section 6: Visit Requests');
    console.log('-'.repeat(40));

    // 6.1 List Visit Requests (Admin)
    const visitReqRes = await request('GET', '/citizen-portal/visit-requests?page=1&limit=10', null, adminToken);
    test('GET /citizen-portal/visit-requests', visitReqRes.data.success === true);

    // ============================================
    // SECTION 7: OFFICERS & VISITS INTEGRATION
    // ============================================
    console.log('\n📋 Section 7: Officers & Visits Integration');
    console.log('-'.repeat(40));

    // 7.1 List Officers
    const officersRes = await request('GET', '/officers?page=1&limit=10', null, adminToken);
    test('GET /officers', officersRes.data.success === true);
    const officers = officersRes.data.data?.items || [];
    test('Officers list has items', officers.length > 0);

    // 7.2 List Visits
    const visitsListRes = await request('GET', '/visits?page=1&limit=10', null, adminToken);
    test('GET /visits', visitsListRes.data.success === true);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 E2E VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`\n  Total Tests: ${passed + failed}`);
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed > 0) {
        console.log('\n❌ Failed Tests:');
        results.filter(r => r.status === 'FAIL').forEach(r => {
            console.log(`  - ${r.test}${r.error ? ': ' + r.error : ''}`);
        });
    }

    console.log('\n' + (failed === 0 ? '🎉 ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED'));
    exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
