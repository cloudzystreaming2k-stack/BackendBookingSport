import User from '../models/User.model.js';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import {
   generateAccessToken,
   generateRefreshToken,
   setRefreshTokenCookie,
   clearRefreshTokenCookie,
} from '../utils/jwt.utils.js';

// @desc    Đăng ký tài khoản mới
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
   const { name, email, password, phone } = req.body;

   const userExists = await User.findOne({ email });
   if (userExists) {
      return res.status(400).json({ message: 'Email này đã được đăng ký.' });
   }

   const user = await User.create({ name, email, password, phone });

   const accessToken = generateAccessToken({ id: user._id, role: user.role });
   const refreshToken = generateRefreshToken({ id: user._id });

   // Lưu refreshToken vào DB để hỗ trợ rotation & blacklist
   user.refreshToken = refreshToken;
   await user.save({ validateBeforeSave: false });

   setRefreshTokenCookie(res, refreshToken);

   res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken,
   });
});

// @desc    Đăng nhập
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
   const { email, password } = req.body;

   const user = await User.findOne({ email });
   if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
   }

   const accessToken = generateAccessToken({ id: user._id, role: user.role });
   const refreshToken = generateRefreshToken({ id: user._id });

   user.refreshToken = refreshToken;
   await user.save({ validateBeforeSave: false });

   setRefreshTokenCookie(res, refreshToken);

   res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken,
   });
});

// @desc    Cấp Access Token mới bằng Refresh Token (Silent Refresh)
// @route   POST /api/auth/refresh-token
// @access  Public (via Cookie)
export const refreshToken = asyncHandler(async (req, res) => {
   const token = req.cookies.refreshToken;

   if (!token) {
      return res.status(401).json({ message: 'Không tìm thấy refresh token.' });
   }

   try {
      const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
      const user = await User.findById(decoded.id);

      // Kiểm tra token có khớp với DB không (Rotation Check)
      if (!user || user.refreshToken !== token) {
         clearRefreshTokenCookie(res);
         return res.status(403).json({ message: 'Refresh token không hợp lệ hoặc đã bị thu hồi.' });
      }

      // Cấp token mới (Rotation: token cũ bị thay thế)
      const newAccessToken = generateAccessToken({ id: user._id, role: user.role });
      const newRefreshToken = generateRefreshToken({ id: user._id });

      user.refreshToken = newRefreshToken;
      await user.save({ validateBeforeSave: false });

      setRefreshTokenCookie(res, newRefreshToken);

      res.json({ accessToken: newAccessToken });
   } catch (error) {
      clearRefreshTokenCookie(res);
      return res.status(403).json({ message: 'Refresh token đã hết hạn. Vui lòng đăng nhập lại.' });
   }
});

// @desc    Đăng xuất
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
   const token = req.cookies.refreshToken;
   if (token) {
      const user = await User.findOne({ refreshToken: token });
      if (user) {
         user.refreshToken = '';
         await user.save({ validateBeforeSave: false });
      }
   }
   clearRefreshTokenCookie(res);
   res.json({ message: 'Đăng xuất thành công.' });
});

// @desc    Lấy thông tin cá nhân
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = asyncHandler(async (req, res) => {
   res.json(req.user);
});
