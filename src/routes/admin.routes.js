import express from 'express';
import {
   getAllCourts, createCourt, updateCourt, deleteCourt, toggleCourtStatus,
} from '../controllers/court.controller.js';
import {
   getAllBookings, updateBookingStatus, getDashboardStats,
   getAllUsers, getUserById, createUserByAdmin, updateUser, deleteUser,
   getOwners, updateOwnerStatus
} from '../controllers/admin.controller.js';
import {
   getAllCourtTypes, createCourtType, updateCourtType, deleteCourtType,
} from '../controllers/courtType.controller.js';
import {
   getAllFacilities, createFacility, updateFacility, deleteFacility,
} from '../controllers/facility.controller.js';
import { protect, adminOnly } from '../middlewares/auth.middleware.js';
import { uploadCourtImages } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.use(protect, adminOnly); // Tất cả admin routes cần xác thực + quyền admin

// Dashboard
router.get('/dashboard', getDashboardStats);

// Court Management
router.route('/courts')
   .get(getAllCourts)
   .post(uploadCourtImages, createCourt);

router.route('/courts/:id')
   .put(uploadCourtImages, updateCourt)
   .delete(deleteCourt);

router.patch('/courts/:id/status', toggleCourtStatus);

// Booking Management
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

// Facility Management
router.route('/facilities')
   .get(getAllFacilities)
   .post(createFacility);

router.route('/facilities/:id')
   .put(updateFacility)
   .delete(deleteFacility);

// Owner Management
router.get('/owners', getOwners);
router.put('/owners/:id/status', updateOwnerStatus);

export default router;
