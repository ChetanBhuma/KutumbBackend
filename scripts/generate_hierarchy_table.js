/**
 * Script to generate a hierarchical table of Range, District, Sub-Division, and Police Station
 * from GeoJSON data.
 */

const fs = require('fs');
const path = require('path');

// Paths to GeoJSON files
const BASE_PATH = path.join(__dirname, '..', 'jsongeo');
const SUB_DIVISION_FILE = path.join(BASE_PATH, 'Sub Division Boundary.geojson');
const PS_FILE = path.join(BASE_PATH, 'ps.geojson');
const OUTPUT_FILE = path.join(__dirname, '..', '..', 'POLICE_HIERARCHY_TABLE.md');

function loadGeoJSON(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
}

function buildHierarchy() {
    // Load Sub-Division data (contains Range, District, Sub-Division mapping)
    const subDivData = loadGeoJSON(SUB_DIVISION_FILE);

    // Load Police Station data
    const psData = loadGeoJSON(PS_FILE);

    // Build hierarchy: Range -> District -> Sub-Division -> Police Stations
    const hierarchy = {};
    const districtToRange = {};
    const psByDistrict = {};

    // Build the Range -> District -> Sub-Division mapping from sub-division data
    for (const feature of subDivData.features) {
        const props = feature.properties;
        const rangeName = props.RANGE || 'UNKNOWN';
        const district = props.DISTRICT || 'UNKNOWN';
        const subDivision = props.SUB_DIVISI || 'UNKNOWN';

        if (!hierarchy[rangeName]) {
            hierarchy[rangeName] = {};
        }
        if (!hierarchy[rangeName][district]) {
            hierarchy[rangeName][district] = new Set();
        }
        hierarchy[rangeName][district].add(subDivision);
        districtToRange[district] = rangeName;
    }

    // Convert Sets to Arrays for easier processing
    for (const range in hierarchy) {
        for (const district in hierarchy[range]) {
            hierarchy[range][district] = Array.from(hierarchy[range][district]).sort();
        }
    }

    // Add Police Stations to their respective districts
    for (const feature of psData.features) {
        const props = feature.properties;
        const psName = props.NAME || 'UNKNOWN';
        const district = props.DISTRICT || 'UNKNOWN';

        if (!psByDistrict[district]) {
            psByDistrict[district] = [];
        }
        psByDistrict[district].push(psName);
    }

    // Sort police stations
    for (const district in psByDistrict) {
        psByDistrict[district].sort();
    }

    return { hierarchy, psByDistrict, districtToRange };
}

function generateMarkdownTable() {
    const { hierarchy, psByDistrict, districtToRange } = buildHierarchy();

    // Sort ranges alphabetically
    const ranges = Object.keys(hierarchy).sort();

    const lines = [];
    lines.push("# Police Hierarchy Table - Delhi");
    lines.push("");
    lines.push("This document contains the hierarchical structure of Delhi Police organization.");
    lines.push("");
    lines.push("---");
    lines.push("");
    lines.push("## Hierarchical View: Range → District → Sub-Division");
    lines.push("");
    lines.push("| Range | District | Sub-Divisions |");
    lines.push("|-------|----------|---------------|");

    for (const rangeName of ranges) {
        const districts = Object.keys(hierarchy[rangeName]).sort();
        let rangeFirst = true;

        for (const district of districts) {
            const subDivisions = hierarchy[rangeName][district];
            const rangeCell = rangeFirst ? rangeName : "";

            lines.push(`| ${rangeCell} | ${district} | ${subDivisions.join(', ')} |`);
            rangeFirst = false;
        }
    }

    lines.push("");
    lines.push("---");
    lines.push("");

    // Detailed view by Range
    lines.push("## Detailed View by Range");
    lines.push("");

    for (const rangeName of ranges) {
        lines.push(`### ${rangeName} Range`);
        lines.push("");

        const districts = Object.keys(hierarchy[rangeName]).sort();

        for (const district of districts) {
            lines.push(`#### ${district} District`);
            lines.push("");

            const subDivisions = hierarchy[rangeName][district];
            lines.push(`**Sub-Divisions:** ${subDivisions.join(', ')}`);
            lines.push("");

            const policeStations = psByDistrict[district] || [];
            if (policeStations.length > 0) {
                lines.push("**Police Stations:**");
                lines.push("");
                policeStations.forEach((ps, i) => {
                    lines.push(`${i + 1}. ${ps}`);
                });
            } else {
                lines.push("*No police stations data available*");
            }
            lines.push("");
        }
    }

    // Add summary statistics
    lines.push("---");
    lines.push("");
    lines.push("## Summary Statistics");
    lines.push("");

    const totalRanges = Object.keys(hierarchy).length;
    let totalDistricts = 0;
    let totalSubDivisions = 0;
    let totalPS = 0;

    for (const range in hierarchy) {
        totalDistricts += Object.keys(hierarchy[range]).length;
        for (const district in hierarchy[range]) {
            totalSubDivisions += hierarchy[range][district].length;
        }
    }

    for (const district in psByDistrict) {
        totalPS += psByDistrict[district].length;
    }

    lines.push(`| Metric | Count |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Ranges | ${totalRanges} |`);
    lines.push(`| Districts | ${totalDistricts} |`);
    lines.push(`| Sub-Divisions | ${totalSubDivisions} |`);
    lines.push(`| Police Stations | ${totalPS} |`);
    lines.push("");

    // Add a comprehensive table with all data
    lines.push("---");
    lines.push("");
    lines.push("## Police Stations by District");
    lines.push("");

    const allDistricts = Object.keys(psByDistrict).sort();

    for (const district of allDistricts) {
        const range = districtToRange[district] || 'UNKNOWN';
        const stations = psByDistrict[district];

        lines.push(`### ${district} (${range} Range)`);
        lines.push("");
        lines.push("| S.No. | Police Station Name |");
        lines.push("|-------|---------------------|");

        stations.forEach((ps, i) => {
            lines.push(`| ${i + 1} | ${ps} |`);
        });

        lines.push("");
    }

    return lines.join("\n");
}

function main() {
    console.log("Loading GeoJSON files...");

    try {
        const markdownContent = generateMarkdownTable();

        console.log(`Writing output to ${OUTPUT_FILE}...`);
        fs.writeFileSync(OUTPUT_FILE, markdownContent, 'utf-8');

        console.log("Done! Markdown table generated successfully.");
        console.log(`Output file: ${OUTPUT_FILE}`);
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

main();
