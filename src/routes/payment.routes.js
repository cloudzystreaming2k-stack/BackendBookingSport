import express from 'express';
import { 
   createPayment, 
   getPaymentByBooking, 
   createVNPayUrl, 
   vnpayReturn 
} from '../controllers/payment.controller.js';
import { protect, adminOnly } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Routes cho Admin quản lý thanh toán tiền mặt
router.post('/', protect, adminOnly, createPayment);
router.get('/booking/:bookingId', protect, getPaymentByBooking);

// Routes cho Thanh toán VNPay
router.post('/vnpay/create-payment-url', protect, createVNPayUrl);
router.get('/vnpay/return', vnpayReturn);

export default router;
