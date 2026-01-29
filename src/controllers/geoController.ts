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
