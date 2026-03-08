import express from 'express';
import {
   createCourt, updateCourt, deleteCourt,
   getAllBookings, updateBookingStatus, getDashboardStats,
   getAllUsers, getUserById, createUserByAdmin, updateUser, deleteUser,
} from '../controllers/admin.controller.js';
import {
   getAllCourtTypes, createCourtType, updateCourtType, deleteCourtType,
} from '../controllers/courtType.controller.js';
import { protect, adminOnly } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect, adminOnly); // Tất cả admin routes cần xác thực + quyền admin

router.get('/dashboard', getDashboardStats);
router.route('/courts').post(createCourt);
router.route('/courts/:id').put(updateCourt).delete(deleteCourt);
router.get('/bookings', getAllBookings);
router.patch('/bookings/:id/status', updateBookingStatus);

// User Management
router.route('/users')
   .get(getAllUsers)
   .post(createUserByAdmin);

router.route('/users/:id')
   .get(getUserById)
   .put(updateUser)
   .delete(deleteUser);

// Court Type Management
router.route('/court-types')
   .get(getAllCourtTypes)
   .post(createCourtType);

router.route('/court-types/:id')
   .put(updateCourtType)
   .delete(deleteCourtType);

export default router;
