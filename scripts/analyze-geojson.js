const fs = require('fs');

// Read Range Boundary
const rangeData = JSON.parse(fs.readFileSync('d:/Bhuma/kutumbfinal/backend/jsongeo/Range Boundary.geojson', 'utf8'));
console.log('\\n=== RANGES ===');
console.log('Total:', rangeData.features.length);
rangeData.features.forEach((f, i) => {
    console.log(`${i+1}. ${f.properties.RANGE}`);
});

// Read District Boundary
const districtData = JSON.parse(fs.readFileSync('d:/Bhuma/kutumbfinal/backend/jsongeo/District Boundary.geojson', 'utf8'));
console.log('\\n=== DISTRICTS ===');
console.log('Total:', districtData.features.length);
districtData.features.slice(0, 5).forEach((f, i) => {
    console.log(`${i+1}. ${f.properties.DISTRICT} (${f.properties.RANGE || 'No Range'})`);
});

// Read SubDivision Boundary
const subDivData = JSON.parse(fs.readFileSync('d:/Bhuma/kutumbfinal/backend/jsongeo/Sub Division Boundary.geojson', 'utf8'));
console.log('\\n=== SUB-DIVISIONS ===');
console.log('Total:', subDivData.features.length);
subDivData.features.slice(0, 5).forEach((f, i) => {
    console.log(`${i+1}. ${f.properties.SUB_DIVISI || f.properties.SUBDIVISION || 'Unknown'}`);
});

// Read Police Station
const psData = JSON.parse(fs.readFileSync('d:/Bhuma/kutumbfinal/backend/jsongeo/Police Station Boundary.geojson', 'utf8'));
console.log('\\n=== POLICE STATIONS ===');
console.log('Total:', psData.features.length);
psData.features.slice(0, 5).forEach((f, i) => {
    console.log(`${i+1}. ${JSON.stringify(f.properties)}`);
});
