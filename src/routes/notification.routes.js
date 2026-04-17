import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
   getMyNotifications,
   markOneRead,
   markAllRead,
} from '../controllers/notification.controller.js';

const router = express.Router();

// Tất cả routes đều yêu cầu đăng nhập
router.use(protect);

router.get('/my', getMyNotifications);
router.patch('/read-all', markAllRead);       // Đặt TRƯỚC /:id để tránh conflict
router.patch('/:id/read', markOneRead);

export default router;
