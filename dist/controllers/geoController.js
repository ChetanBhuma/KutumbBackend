"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubDivisions = exports.getRanges = exports.getBoundaries = exports.getPoliceStations = exports.getDistricts = void 0;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const logger_1 = require("../config/logger");
const database_1 = require("../config/database");
// Helper to safely read GeoJSON
const readGeoJsonSafe = async (filename) => {
    try {
        const filePath = path_1.default.join(process.cwd(), 'jsongeo', filename);
        try {
            const stats = await promises_1.default.stat(filePath);
            if (stats.size === 0)
                return { type: 'FeatureCollection', features: [] };
            const data = await promises_1.default.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        }
        catch (err) {
            // File not found or other fs error
            logger_1.logger.warn(`GeoJSON file not found or unreadable: ${filename}`);
            return { type: 'FeatureCollection', features: [] };
        }
    }
    catch (error) {
        logger_1.logger.error(`Error processing GeoJSON ${filename}:`, error);
        return { type: 'FeatureCollection', features: [] };
    }
};
const getDistricts = async (_req, res, next) => {
    try {
        const geoJson = await readGeoJsonSafe('dist.geojson');
        res.json(geoJson);
    }
    catch (error) {
        next(error);
    }
};
exports.getDistricts = getDistricts;
const getPoliceStations = async (_req, res, _next) => {
    try {
        // Fetch from DB to ensure latest data
        const stations = await database_1.prisma.policeStation.findMany({
            where: {
                isActive: true,
                latitude: { not: null },
                longitude: { not: null }
            },
            select: {
                id: true,
                name: true,
                code: true,
                latitude: true,
                longitude: true,
                districtId: true,
                District: { select: { name: true } }
            }
        });
        // Convert to GeoJSON FeatureCollection
        const features = stations.map(ps => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [ps.longitude, ps.latitude] // GeoJSON is [lng, lat]
            },
            properties: {
                ID: ps.id,
                NAME: ps.name,
                CODE: ps.code,
                DISTRICT: ps.District?.name,
                LAYER_TYPE: 'PS_POINT'
            }
        }));
        res.json({
            type: 'FeatureCollection',
            features
        });
    }
    catch (error) {
        // Fallback to file if DB fails
        logger_1.logger.error('Error fetching PS from DB, falling back to file:', error);
        const geoJson = await readGeoJsonSafe('ps.geojson');
        res.json(geoJson);
    }
};
exports.getPoliceStations = getPoliceStations;
const getBoundaries = async (_req, res, next) => {
    try {
        const geoJson = await readGeoJsonSafe('Police Station Boundary.geojson');
        res.json(geoJson);
    }
    catch (error) {
        next(error);
    }
};
exports.getBoundaries = getBoundaries;
const getRanges = async (_req, res, next) => {
    try {
        const geoJson = await readGeoJsonSafe('Range Boundary.geojson');
        res.json(geoJson);
    }
    catch (error) {
        next(error);
    }
};
exports.getRanges = getRanges;
const getSubDivisions = async (_req, res, next) => {
    try {
        const geoJson = await readGeoJsonSafe('Sub Division Boundary.geojson');
        res.json(geoJson);
    }
    catch (error) {
        next(error);
    }
};
exports.getSubDivisions = getSubDivisions;
//# sourceMappingURL=geoController.js.map