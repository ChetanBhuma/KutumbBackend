const axios = require('axios');

async function checkIds() {
    const baseUrl = 'http://localhost:5000/api/v1';
    try {
        const dRes = await axios.get(`${baseUrl}/masters/districts`);
        const districts = dRes.data.data || dRes.data;

        const psRes = await axios.get(`${baseUrl}/masters/police-stations`);
        const stations = psRes.data.data || psRes.data;

        console.log('Total Districts:', districts.length);
        console.log('Sample District ID:', districts[0]?.id);

        console.log('Total Stations:', stations.length);
        console.log('Sample Station districtId:', stations[0]?.districtId);

        // Check for orphan stations
        const orphanStations = stations.filter(s => !districts.find(d => d.id === s.districtId));
        console.log('Orphan Stations count:', orphanStations.length);

        if (orphanStations.length > 0) {
             console.log('Sample Orphan Station:', JSON.stringify(orphanStations[0]));
        }

        // Check if filtering works for the first district
        const firstDistrictId = districts[0]?.id;
        const matchingStations = stations.filter(s => s.districtId === firstDistrictId);
        console.log(`Stations for District ${firstDistrictId}:`, matchingStations.length);

    } catch (e) {
        console.log(e.message);
    }
}
checkIds();
