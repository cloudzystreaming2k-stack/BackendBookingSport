import express from 'express';
import { getCourts, getCourtById, getCourtSlotsByDate } from '../controllers/court.controller.js';
import { getAllCourtTypes } from '../controllers/courtType.controller.js';
import { getAllFacilities } from '../controllers/facility.controller.js';

const router = express.Router();

router.get('/', getCourts);
router.get('/types', getAllCourtTypes);
router.get('/facilities', getAllFacilities);
router.get('/:id/slots', getCourtSlotsByDate); // Phải đặt TRƯỚC /:id
router.get('/:id', getCourtById);

export default router;
