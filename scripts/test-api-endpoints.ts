
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000/api/v1';

const endpoints = [
    { method: 'GET', url: '/auth/me', name: 'Get Current User' },
    { method: 'GET', url: '/citizens?limit=1', name: 'List Citizens' },
    { method: 'GET', url: '/officers?limit=1', name: 'List Officers' },
    { method: 'GET', url: '/visits?limit=1', name: 'List Visits' },
    { method: 'GET', url: '/sos/active', name: 'Active SOS' },
    { method: 'GET', url: '/beats', name: 'List Beats' },
    { method: 'GET', url: '/roles', name: 'List Roles' },
    { method: 'GET', url: '/users?limit=1', name: 'List Users' },
    { method: 'GET', url: '/system/audit-logs?limit=1', name: 'Audit Logs' },
    { method: 'GET', url: '/notifications', name: 'List Notifications' },
    { method: 'GET', url: '/reports/dashboard', name: 'Dashboard Stats' },
    { method: 'GET', url: '/masters/districts', name: 'Master Districts' },
    { method: 'GET', url: '/masters/police-stations', name: 'Master Police Stations' }
];

async function runTests() {
    console.log('🚀 Starting API Test Suite...');

    // 1. Login
    let token = '';
    try {
        console.log('🔑 Authenticating as Super Admin...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            identifier: 'superadmin@delhipolice.gov.in',
            password: 'Admin@123'
        });

        // Debug log structure if needed
        // console.log(JSON.stringify(loginRes.data, null, 2));

        if (loginRes.data && loginRes.data.data && loginRes.data.data.tokens && loginRes.data.data.tokens.accessToken) {
             token = loginRes.data.data.tokens.accessToken;
             console.log('✅ Login Successful');
        } else {
             console.error('❌ Login Failed: Token not found in response', JSON.stringify(loginRes.data));
             return;
        }

    } catch (error) {
        console.error('❌ Login Failed:', error.message);
        if (error.response) console.error('Response:', JSON.stringify(error.response.data));
        return;
    }

    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };

    const results = [];

    // 2. Test Endpoints
    for (const endpoint of endpoints) {
        try {
            process.stdout.write(`Testing ${endpoint.name} (${endpoint.url})... `);
            const start = Date.now();
            const res = await axios.get(`${BASE_URL}${endpoint.url}`, config);
            const duration = Date.now() - start;

            process.stdout.write(`✅ ${res.status} OK (${duration}ms)\n`);
            results.push({ ...endpoint, status: 'PASS', code: res.status, duration });
        } catch (error) {
            process.stdout.write(`❌ FAILED\n`);
            const code = error.response ? error.response.status : 'ERR';
            const msg = error.response ? JSON.stringify(error.response.data) : error.message;
            // console.error(`   Error: ${code} - ${msg}`);
            results.push({ ...endpoint, status: 'FAIL', code, error: msg });
        }
    }

    // 3. Generate Markdown Report
    let report = '# API Test Report\n\n';
    report += `**Date:** ${new Date().toLocaleString()}\n`;
    report += `**Base URL:** ${BASE_URL}\n\n`;
    report += '| Endpoint | Method | Status | Code | Duration | Error |\n';
    report += '| :--- | :--- | :--- | :--- | :--- | :--- |\n';

    results.forEach(r => {
        report += `| ${r.name} | ${r.method} | ${r.status === 'PASS' ? '✅ PASS' : '❌ FAIL'} | ${r.code} | ${r.duration || '-'}ms | ${r.error ? `\`${r.error.substring(0, 50)}...\`` : '-'} |\n`;
    });

    fs.writeFileSync('API_Test_Results.md', report);
    console.log('\n📄 Report generated: API_Test_Results.md');
}

runTests();
