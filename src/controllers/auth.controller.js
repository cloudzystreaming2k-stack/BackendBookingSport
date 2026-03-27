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
   const { firstName, lastName, email, password, phone, gender, dateOfBirth } = req.body;

   if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ Họ và Tên.' });
   }

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

   const user = await User.create({ firstName, lastName, email, password, phone, gender, dateOfBirth });

   const accessToken = generateAccessToken({ id: user._id, role: user.role });
   const refreshToken = generateRefreshToken({ id: user._id });

   user.refreshToken = refreshToken;
   await user.save({ validateBeforeSave: false });

   setRefreshTokenCookie(res, refreshToken);

   res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      accessToken,
   });
});

// @desc    Đăng ký tài khoản Đối tác Chủ Sân
// @route   POST /api/auth/register-owner
// @access  Public
export const registerOwner = asyncHandler(async (req, res) => {
   const { 
      firstName, lastName, email, phone, gender, dateOfBirth, password,
      ownerInfo
   } = req.body;

   // 1. Kiểm tra Validate cơ bản
   if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ Họ và Tên.' });
   }

   if (!ownerInfo || !ownerInfo.ownerName || !ownerInfo.identityNumber || !ownerInfo.businessName || !ownerInfo.taxCode || !ownerInfo.bankName || !ownerInfo.accountNumber) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ các thông tin Kinh doanh và Thanh toán bắt buộc.' });
   }

   // 2. Chống trùng lặp email / sdt
   const orConditions = [{ email }];
   if (phone) {
      orConditions.push({ phone });
   }

   const existingUser = await User.findOne({ $or: orConditions });
   if (existingUser) {
      if (existingUser.email === email) {
         return res.status(400).json({ message: 'Email này đã được đăng ký trong hệ thống.' });
      }
      if (phone && existingUser.phone === phone) {
         return res.status(400).json({ message: 'Số điện thoại này đã được đăng ký.' });
      }
   }

   // 3. Insert Database
   const user = await User.create({ 
      firstName, lastName, email, password, phone, gender, dateOfBirth,
      role: 'owner',
      status: 'pending',
      ownerInfo: {
          ownerName: ownerInfo.ownerName,
          identityNumber: ownerInfo.identityNumber,
          businessName: ownerInfo.businessName,
          taxCode: ownerInfo.taxCode,
          businessAddress: ownerInfo.businessAddress,
          businessPhone: ownerInfo.businessPhone,
          bankName: ownerInfo.bankName.toUpperCase(),
          accountNumber: ownerInfo.accountNumber,
          accountOwner: ownerInfo.accountOwner.toUpperCase()
      }
   });

   res.status(201).json({
      message: 'Đăng ký Đối tác thành công. Vui lòng chờ phê duyệt từ Ban quản trị.',
      _id: user._id,
      email: user.email,
      role: user.role,
      status: user.status
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

   // Phân quyền đặc thù cho Owner Login
   if (user.role === 'owner') {
      if (user.status === 'pending') {
          return res.status(403).json({ message: 'Tài khoản Chủ Sân của bạn đang chờ Admin phê duyệt.' });
      }
      if (user.status === 'rejected') {
          return res.status(403).json({ message: 'Tài khoản đăng ký Đối tác đã bị từ chối. Vui lòng liên hệ Admin.' });
      }
   }

   const accessToken = generateAccessToken({ id: user._id, role: user.role });
   const refreshToken = generateRefreshToken({ id: user._id });

   user.refreshToken = refreshToken;
   await user.save({ validateBeforeSave: false });

   setRefreshTokenCookie(res, refreshToken);

   res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
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
      let email, firstName, lastName, picture;

      if (token.startsWith('eyJ')) {
         const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
         });
         const payload = ticket.getPayload();
         email = payload.email;
         firstName = payload.given_name || payload.name?.split(' ').pop() || 'User';
         lastName  = payload.family_name || payload.name?.split(' ').slice(0, -1).join(' ') || '';
         picture = payload.picture;
      } else {
         const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
         });
         email = response.data.email;
         firstName = response.data.given_name || response.data.name?.split(' ').pop() || 'User';
         lastName  = response.data.family_name || response.data.name?.split(' ').slice(0, -1).join(' ') || '';
         picture = response.data.picture;
      }

      let user = await User.findOne({ email });
      let isNew = false;

      if (!user) {
         user = await User.create({
            firstName,
            lastName,
            email,
            password: null,
            role: 'user',
            avatar: picture,
         });
         isNew = true;
      } else {
         if (!user.avatar && picture) {
             user.avatar = picture;
         }
      }

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
         firstName: user.firstName,
         lastName: user.lastName,
         email: user.email,
         role: user.role,
         isNew,
         accessToken,
      });
   } catch (error) {
      console.error('Google Auth Error:', error);
      return res.status(401).json({ message: 'Lỗi Xác thực Google: ' + (error.message || 'Unknown') });
   }
});

// @desc    Xác thực qua Facebook OAuth
// @route   POST /api/auth/facebook
// @access  Public
export const facebookLogin = asyncHandler(async (req, res) => {
   const { token } = req.body;

   if (!token) {
      return res.status(400).json({ message: 'Không tìm thấy accessToken Facebook.' });
   }

   try {
      // 1. Dùng mã token gọi thẳng vào Graph API của FB để lấy dữ liệu
      const fbResponse = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${token}`);
      const { name: fbFullName, email, picture } = fbResponse.data;

      // Tách họ và tên từ chuỗi full name của Facebook
      const nameParts = (fbFullName || '').trim().split(' ');
      const firstName = nameParts.pop() || 'User'; // Tên = phần tử cuối
      const lastName  = nameParts.join(' ') || '';  // Họ đệm = phần còn lại

      if (!email) {
         return res.status(400).json({ message: 'Tài khoản Facebook chưa được cấp quyền Email, vui lòng thử lại hoặc dùng phương pháp khác.' });
      }

      const avatarUrl = picture?.data?.url || '';

      let user = await User.findOne({ email });
      let isNew = false;

      if (user) {
         if (!user.avatar && avatarUrl) {
            user.avatar = avatarUrl;
            await user.save({ validateBeforeSave: false });
         }

         if (!user.password || !user.phone || !user.gender || !user.dateOfBirth) {
            isNew = true;
         }
      } else {
         user = await User.create({
            firstName,
            lastName,
            email,
            password: null,
            role: 'user',
            avatar: avatarUrl,
         });
         isNew = true;
      }

      const accessToken = generateAccessToken({ id: user._id, role: user.role });
      const refreshToken = generateRefreshToken({ id: user._id });

      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      setRefreshTokenCookie(res, refreshToken);

      res.json({
         _id: user._id,
         firstName: user.firstName,
         lastName: user.lastName,
         email: user.email,
         role: user.role,
         isNew,
         accessToken,
      });

   } catch (error) {
      console.error('Facebook Auth Error:', error.response?.data || error.message);
      return res.status(401).json({ message: 'Lỗi Xác thực Facebook: ' + (error.response?.data?.error?.message || error.message || 'Unknown') });
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
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      message: 'Cập nhật thông tin thành công.'
   });
});
