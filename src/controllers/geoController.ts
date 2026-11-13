import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../config/logger';
import { prisma } from '../config/database';

// Helper to safely read GeoJSON
const readGeoJsonSafe = async (filename: string) => {
    try {
        const filePath = path.join(process.cwd(), 'jsongeo', filename);
        try {
            const stats = await fs.stat(filePath);
            if (stats.size === 0) return { type: 'FeatureCollection', features: [] };

            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (err) {
            // File not found or other fs error
            logger.warn(`GeoJSON file not found or unreadable: ${filename}`);
            return { type: 'FeatureCollection', features: [] };
        }
    } catch (error) {
        logger.error(`Error processing GeoJSON ${filename}:`, error);
        return { type: 'FeatureCollection', features: [] };
    }
};

export const getDistricts = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const geoJson = await readGeoJsonSafe('dist.geojson');
        res.json(geoJson);
    } catch (error) {
        next(error);
    }
};

export const getPoliceStations = async (_req: Request, res: Response, _next: NextFunction) => {
    try {
        // Fetch from DB to ensure latest data
        const stations = await prisma.policeStation.findMany({
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
    } catch (error) {
        // Fallback to file if DB fails
        logger.error('Error fetching PS from DB, falling back to file:', error);
        const geoJson = await readGeoJsonSafe('ps.geojson');
        res.json(geoJson);
    }
};

export const getBoundaries = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const geoJson = await readGeoJsonSafe('Police Station Boundary.geojson');
        res.json(geoJson);
    } catch (error) {
        next(error);
    }
};

export const getRanges = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const geoJson = await readGeoJsonSafe('Range Boundary.geojson');
        res.json(geoJson);
    } catch (error) {
        next(error);
    }
};

export const getSubDivisions = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const geoJson = await readGeoJsonSafe('Sub Division Boundary.geojson');
        res.json(geoJson);
    } catch (error) {
        next(error);
    }
};

let cachedBoundaries: any = null;

const getCachedBoundaries = async () => {
    if (!cachedBoundaries || !cachedBoundaries.features || cachedBoundaries.features.length === 0) {
        cachedBoundaries = await readGeoJsonSafe('Police Station Boundary.geojson');
    }
    return cachedBoundaries;
};

// Point in Polygon Ray Casting algorithm matching frontend geofence
const isPointInPolygon = (lat: number, lng: number, polygon: any[]): boolean => {
    const ring = polygon[0];
    if (!ring || ring.length < 3) return false;
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];
        const intersect = ((yi > lat) !== (yj > lat))
            && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

const findFeatureContainingPoint = (lat: number, lng: number, featureCollection: any) => {
    if (!featureCollection || !featureCollection.features) return null;
    for (const feature of featureCollection.features) {
        if (!feature.geometry) continue;
        if (feature.geometry.type === 'Polygon') {
            if (isPointInPolygon(lat, lng, feature.geometry.coordinates)) {
                return feature;
            }
        } else if (feature.geometry.type === 'MultiPolygon') {
            for (const polygon of feature.geometry.coordinates) {
                if (isPointInPolygon(lat, lng, polygon)) {
                    return feature;
                }
            }
        }
    }
    return null;
};

export const detectJurisdiction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const lat = parseFloat(req.query.lat as string);
        const lng = parseFloat(req.query.lng as string);

        if (isNaN(lat) || isNaN(lng)) {
            res.status(400).json({ success: false, message: 'Valid lat and lng query parameters are required' });
            return;
        }

        const boundaries = await getCachedBoundaries();
        const feature = findFeatureContainingPoint(lat, lng, boundaries);

        if (feature && feature.properties) {
            const rawPsName = feature.properties.POL_STN_NM || feature.properties.NAME || feature.properties.Name || '';
            const rawDistName = feature.properties.DIST_NM || feature.properties.DISTRICT || feature.properties.District || '';
            res.json({
                success: true,
                data: {
                    policeStationName: rawPsName,
                    districtName: rawDistName,
                    subDivision: feature.properties.SUB_DIVISI || '',
                    range: feature.properties.RANGE || ''
                }
            });
            return;
        }

        res.json({
            success: true,
            data: null
        });
        return;
    } catch (error) {
        next(error);
    }
};
