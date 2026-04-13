import express from 'express';
import { createBooking, getMyBookings, getBookingById } from '../controllers/booking.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect); // Tất cả booking routes đều cần đăng nhập

// User routes
router.post('/', createBooking);           // POST /api/bookings - Tạo đơn đặt sân
router.get('/my', getMyBookings);         // GET /api/bookings/my - Lịch sử đặt sân của user
router.get('/:id', getBookingById);       // GET /api/bookings/:id - Chi tiết một đơn

export default router;
