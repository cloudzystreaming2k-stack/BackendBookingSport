import express from 'express';
import { getProvinces, getDistrictsByProvince } from '../controllers/location.controller.js';

const router = express.Router();

// GET /api/locations/provinces
router.get('/provinces', getProvinces);

// GET /api/locations/provinces/:code/districts
router.get('/provinces/:code/districts', getDistrictsByProvince);

export default router;
