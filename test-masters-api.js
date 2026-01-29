const axios = require('axios');

async function checkMasters() {
    const baseUrl = 'http://localhost:5000/api/v1';

    try {
        console.log('Fetching Districts...');
        const dRes = await axios.get(`${baseUrl}/masters/districts`);
        console.log('Districts Response Status:', dRes.status);
        console.log('Districts Response Data Structure:', JSON.stringify(dRes.data).substring(0, 200));

        console.log('\nFetching Police Stations...');
        const psRes = await axios.get(`${baseUrl}/masters/police-stations`);
        console.log('Police Stations Response Status:', psRes.status);
        console.log('Police Stations Response Data Structure:', JSON.stringify(psRes.data).substring(0, 200));

    } catch (error) {
        console.error('Error fetching masters:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
    }
}

checkMasters();
