import express from 'express';
import { getCourts, getCourtById } from '../controllers/court.controller.js';

const router = express.Router();

router.get('/', getCourts);
router.get('/:id', getCourtById);

export default router;
