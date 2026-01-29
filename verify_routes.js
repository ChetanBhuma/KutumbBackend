
const axios = require('axios');

async function testRoutes() {
    const urls = [
        'http://localhost:5000/api/v1/visits/officer/assignments',
        'http://localhost:5000/api/v1/officer-app/dashboard/metrics',
        'http://localhost:5000/api/v1/health'
    ];

    for (const url of urls) {
        try {
            console.log(`Testing URL: ${url}`);
            const response = await axios.get(url, { validateStatus: () => true });
            console.log(`Status: ${response.status}`);
            console.log(`Response:`, response.data);
            console.log('-----------------------------------');
        } catch (error) {
            console.error(`Error testing ${url}:`, error.message);
        }
    }
}

testRoutes();
