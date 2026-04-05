import express from 'express';
import { getCourts, getCourtById, getCourtSlotsByDate } from '../controllers/court.controller.js';

const router = express.Router();

router.get('/', getCourts);
router.get('/:id/slots', getCourtSlotsByDate); // Phải đặt TRƯỜC /:id
router.get('/:id', getCourtById);

export default router;
