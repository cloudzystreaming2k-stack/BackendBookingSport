import User from '../models/User.model.js';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
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
   const { name, email, password, phone, gender, dateOfBirth } = req.body;

   if (!gender || !['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({ message: 'Vui lòng chọn giới tính hợp lệ (Nam, Nữ hoặc Khác).' });
   }

   if (!dateOfBirth || isNaN(new Date(dateOfBirth).getTime()) || new Date(dateOfBirth) > new Date()) {
      return res.status(400).json({ message: 'Vui lòng nhập ngày sinh hợp lệ và không lớn hơn hiện tại.' });
   }

   // Kiểm tra Email hoặc Số điện thoại đã tồn tại
   const orConditions = [{ email }];
   if (phone) {
      orConditions.push({ phone });
   }

   const existingUser = await User.findOne({ $or: orConditions });
   if (existingUser) {
      if (existingUser.email === email) {
         return res.status(400).json({ message: 'Email này đã được đăng ký.' });
      }
      if (phone && existingUser.phone === phone) {
         return res.status(400).json({ message: 'Số điện thoại này đã được đăng ký.' });
      }
   }

   const user = await User.create({ name, email, password, phone, gender, dateOfBirth });

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

// @desc    Đăng nhập bằng Google
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = asyncHandler(async (req, res) => {
   const { token } = req.body;

   if (!token) {
      return res.status(400).json({ message: 'Không tìm thấy token Google.' });
   }

   try {
      let email, name, picture;

      if (token.startsWith('eyJ')) {
         // Là id_token nguyên bản (ví dụ tử tool hoặc postman)
         const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
         });
         const payload = ticket.getPayload();
         email = payload.email;
         name = payload.name;
         picture = payload.picture;
      } else {
         // Là access_token do component Frontend custom (useGoogleLogin) tự fetch
         const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
         });
         email = response.data.email;
         name = response.data.name;
         picture = response.data.picture;
      }

      let user = await User.findOne({ email });
      let isNew = false;

      if (!user) {
         // Tài khoản mới toanh
         user = await User.create({
            name,
            email,
            password: null, // Sẽ điền sau
            role: 'user',
            avatar: picture,
         });
         isNew = true;
      } else {
         // Cập nhật avatar nếu User cũ chưa có
         if (!user.avatar && picture) {
             user.avatar = picture;
         }
      }

      // Kiểm tra xem đã đầy đủ thông tin chưa
      if (!user.password || !user.phone || !user.gender || !user.dateOfBirth) {
         isNew = true;
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
         isNew, // Gắn cờ cho Frontend bắt Popup bổ sung thông tin
         accessToken,
      });
   } catch (error) {
      console.error('Google Auth Error:', error);
      return res.status(401).json({ message: 'Lỗi Xác thực Google: ' + (error.message || 'Unknown') });
   }
});

// @desc    Bổ sung thông tin cá nhân sau khi đăng nhập Google
// @route   POST /api/auth/update-profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
   const { phone, gender, dateOfBirth, password } = req.body;
   const user = await User.findById(req.user._id);

   if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
   }

   if (!phone || !gender || !dateOfBirth || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' });
   }

   if (!['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({ message: 'Vui lòng chọn giới tính hợp lệ (Nam, Nữ hoặc Khác).' });
   }

   if (isNaN(new Date(dateOfBirth).getTime()) || new Date(dateOfBirth) > new Date()) {
      return res.status(400).json({ message: 'Vui lòng nhập ngày sinh hợp lệ và không lớn hơn hiện tại.' });
   }

   if (password.length < 6) {
       return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
   }

   const phoneExists = await User.findOne({ phone, _id: { $ne: user._id } });
   if (phoneExists) {
      return res.status(400).json({ message: 'Số điện thoại này đã được sử dụng.' });
   }

   user.phone = phone;
   user.gender = gender;
   user.dateOfBirth = dateOfBirth;
   user.password = password; 

   await user.save();

   res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      message: 'Cập nhật thông tin thành công.'
   });
});
