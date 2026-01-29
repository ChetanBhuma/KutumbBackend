"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const geoController_1 = require("../controllers/geoController");
const router = express_1.default.Router();
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
router.get('/districts', geoController_1.getDistricts);
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
router.get('/police-stations', geoController_1.getPoliceStations);
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
router.get('/boundaries', geoController_1.getBoundaries);
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
router.get('/ranges', geoController_1.getRanges);
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
router.get('/sub-divisions', geoController_1.getSubDivisions);
exports.default = router;
//# sourceMappingURL=geoRoutes.js.map