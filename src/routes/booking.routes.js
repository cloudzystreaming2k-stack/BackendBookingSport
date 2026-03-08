import express from 'express';
import { createBooking, getMyBookings } from '../controllers/booking.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect); // Tất cả booking routes đều cần đăng nhập
router.get('/my-bookings', getMyBookings);
router.post('/', createBooking);

export default router;
