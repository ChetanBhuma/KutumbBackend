const fs = require('fs');

const data = JSON.parse(fs.readFileSync('d:/Bhuma/kutumbfinal/backend/jsongeo/Police Station Boundary.geojson', 'utf8'));

console.log('Total Police Stations:', data.features.length);
console.log('\nSample Properties:');
data.features.slice(0, 5).forEach((f, i) => {
    console.log(`\n${i+1}. ${f.properties.POL_STN_NM || f.properties.PS_NAME || 'Unknown'}`);
    console.log('   Properties:', JSON.stringify(f.properties, null, 2));
});
