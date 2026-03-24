import Booking from '../models/Booking.model.js';
import User from '../models/User.model.js';
import Court from '../models/Court.model.js';
import asyncHandler from 'express-async-handler';

// ─── USER MANAGEMENT ─────────────────────────────────────────────

// @desc    Lấy danh sách tất cả người dùng (có lọc, tìm kiếm, phân trang)
// @route   GET /api/admin/users
// @access  Admin
export const getAllUsers = asyncHandler(async (req, res) => {
   const { role, search, page = 1, limit = 10 } = req.query;

   const filter = {};
   if (role) filter.role = role;
   if (search) {
      filter.$or = [
         { name: { $regex: search, $options: 'i' } },
         { email: { $regex: search, $options: 'i' } },
      ];
   }

   const skip = (Number(page) - 1) * Number(limit);
   const [users, total] = await Promise.all([
      User.find(filter)
         .select('-password -refreshToken')
         .sort({ createdAt: -1 })
         .skip(skip)
         .limit(Number(limit)),
      User.countDocuments(filter),
   ]);

   res.json({
      users,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
   });
});

// @desc    Lấy chi tiết một người dùng
// @route   GET /api/admin/users/:id
// @access  Admin
export const getUserById = asyncHandler(async (req, res) => {
   const user = await User.findById(req.params.id).select('-password -refreshToken');
   if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
   res.json(user);
});

// @desc    Admin tạo người dùng mới (có thể chỉ định role)
// @route   POST /api/admin/users
// @access  Admin
export const createUserByAdmin = asyncHandler(async (req, res) => {
   const { firstName, lastName, email, password, phone, role, gender, dateOfBirth } = req.body;

   if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ Họ và Tên.' });
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

   const user = await User.create({ firstName, lastName, email, password, phone, role: role || 'user', gender, dateOfBirth });

   res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
   });
});

// @desc    Cập nhật thông tin hoặc role người dùng
// @route   PUT /api/admin/users/:id
// @access  Admin
export const updateUser = asyncHandler(async (req, res) => {
   const user = await User.findById(req.params.id);
   if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

   const { firstName, lastName, email, phone, role } = req.body;

   // Block thay đổi gây trùng lặp (nếu tồn tại req thay đổi email, phone)
   const orConditions = [];
   if (email && email !== user.email) orConditions.push({ email });
   if (phone && phone !== user.phone) orConditions.push({ phone });

   if (orConditions.length > 0) {
      const existingUser = await User.findOne({ 
         _id: { $ne: req.params.id }, 
         $or: orConditions 
      });

      if (existingUser) {
         if (email && existingUser.email === email) {
            return res.status(400).json({ message: 'Email này đã được đăng ký cho tài khoản khác.' });
         }
         if (phone && existingUser.phone === phone) {
            return res.status(400).json({ message: 'Số điện thoại này đã được đăng ký cho tài khoản khác.' });
         }
      }
   }

   if (firstName) user.firstName = firstName;
   if (lastName !== undefined) user.lastName = lastName;
   if (email) user.email = email;
   if (phone) user.phone = phone;
   if (role) user.role = role;

   const updated = await user.save({ validateBeforeSave: false });

   res.json({
      _id: updated._id,
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
      phone: updated.phone,
      role: updated.role,
      createdAt: updated.createdAt,
   });
});

// @desc    Xóa người dùng
// @route   DELETE /api/admin/users/:id
// @access  Admin
export const deleteUser = asyncHandler(async (req, res) => {
   // Ngăn Admin tự xóa chính mình
   if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Không thể xóa tài khoản đang đăng nhập.' });
   }

   const user = await User.findByIdAndDelete(req.params.id);
   if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

   res.json({ message: `Đã xóa tài khoản ${user.email} thành công.` });
});

// @desc    Lấy tất cả đơn đặt sân
// @route   GET /api/admin/bookings
export const getAllBookings = asyncHandler(async (req, res) => {
   const bookings = await Booking.find({})
      .populate('userId', 'name email phone')
      .populate('courtId', 'name address')
      .sort({ createdAt: -1 });
   res.json(bookings);
});

// @desc    Cập nhật trạng thái đơn
// @route   PATCH /api/admin/bookings/:id/status
export const updateBookingStatus = asyncHandler(async (req, res) => {
   const { status } = req.body;
   const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
   if (!booking) return res.status(404).json({ message: 'Không tìm thấy đơn đặt sân.' });
   res.json(booking);
});

// @desc    Thống kê cho Dashboard Admin
// @route   GET /api/admin/dashboard
export const getDashboardStats = asyncHandler(async (req, res) => {
   const [totalBookings, totalCourts, totalUsers] = await Promise.all([
      Booking.countDocuments(),
      Court.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'user' }),
   ]);

   const revenueData = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: { $month: '$bookingDate' }, total: { $sum: '$totalPrice' } } },
      { $sort: { '_id': 1 } },
   ]);

   res.json({ totalBookings, totalCourts, totalUsers, revenueData });
});
