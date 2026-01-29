const fs = require('fs');
const path = require('path');

const files = [
    'Range Boundary.geojson',
    'District Boundary.geojson',
    'Sub Division Boundary.geojson',
    'Police Station Boundary.geojson'
];

const dir = path.join(__dirname, '../jsongeo');

files.forEach(file => {
    try {
        const filePath = path.join(dir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(content);
        if (json.features && json.features.length > 0) {
            console.log(`\nFile: ${file}`);
            console.log('Keys:', Object.keys(json.features[0].properties));
            // Log sample to see values
            console.log('Sample:', JSON.stringify(json.features[0].properties, null, 2));
        } else {
            console.log(`\nFile: ${file} - No features found`);
        }
    } catch (e) {
        console.error(`Error reading ${file}:`, e.message);
    }
});
