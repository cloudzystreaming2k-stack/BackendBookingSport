import express from 'express';
import { register, login, refreshToken, logout, getProfile, googleLogin, facebookLogin, updateProfile } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);
router.get('/profile', protect, getProfile);

// Google OAuth & Facebook OAuth
router.post('/google', googleLogin);
router.post('/facebook', facebookLogin);
router.post('/update-profile', protect, updateProfile);

export default router;
