import express from 'express';
import { getDistricts, getPoliceStations, getBoundaries, getRanges, getSubDivisions } from '../controllers/geoController';

const router = express.Router();

/**
 * @swagger
 * /geo/districts:
 *   get:
 *     tags: [GeoJSON]
 *     summary: Get district boundaries GeoJSON
 *     responses:
 *       200:
 *         description: GeoJSON FeatureCollection
 */
router.get('/districts', getDistricts);

/**
 * @swagger
 * /geo/police-stations:
 *   get:
 *     tags: [GeoJSON]
 *     summary: Get police station locations GeoJSON
 *     responses:
 *       200:
 *         description: GeoJSON FeatureCollection of points
 */
router.get('/police-stations', getPoliceStations);

/**
 * @swagger
 * /geo/boundaries:
 *   get:
 *     tags: [GeoJSON]
 *     summary: Get police station boundaries GeoJSON
 *     responses:
 *       200:
 *         description: GeoJSON FeatureCollection of polygons
 */
router.get('/boundaries', getBoundaries);

/**
 * @swagger
 * /geo/ranges:
 *   get:
 *     tags: [GeoJSON]
 *     summary: Get range boundaries GeoJSON
 *     responses:
 *       200:
 *         description: GeoJSON FeatureCollection
 */
router.get('/ranges', getRanges);

/**
 * @swagger
 * /geo/sub-divisions:
 *   get:
 *     tags: [GeoJSON]
 *     summary: Get sub-division boundaries GeoJSON
 *     responses:
 *       200:
 *         description: GeoJSON FeatureCollection
 */
router.get('/sub-divisions', getSubDivisions);

export default router;
