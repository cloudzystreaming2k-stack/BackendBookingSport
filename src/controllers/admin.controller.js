import Court from '../models/Court.model.js';
import Booking from '../models/Booking.model.js';
import User from '../models/User.model.js';
import CourtType from '../models/CourtType.model.js';
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
   const { name, email, password, phone, role } = req.body;

   const userExists = await User.findOne({ email });
   if (userExists) {
      return res.status(400).json({ message: 'Email này đã được đăng ký.' });
   }

   const user = await User.create({ name, email, password, phone, role: role || 'user' });

   res.status(201).json({
      _id: user._id,
      name: user.name,
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

   const { name, email, phone, role } = req.body;
   if (name) user.name = name;
   if (email) user.email = email;
   if (phone) user.phone = phone;
   if (role) user.role = role;

   const updated = await user.save({ validateBeforeSave: false });

   res.json({
      _id: updated._id,
      name: updated.name,
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


// @desc    Thêm sân mới
// @route   POST /api/admin/courts
export const createCourt = asyncHandler(async (req, res) => {
   const court = await Court.create(req.body);
   res.status(201).json(court);
});

// @desc    Cập nhật sân
// @route   PUT /api/admin/courts/:id
export const updateCourt = asyncHandler(async (req, res) => {
   const court = await Court.findByIdAndUpdate(req.params.id, req.body, { new: true });
   if (!court) return res.status(404).json({ message: 'Không tìm thấy sân.' });
   res.json(court);
});

// @desc    Xóa sân
// @route   DELETE /api/admin/courts/:id
export const deleteCourt = asyncHandler(async (req, res) => {
   const court = await Court.findByIdAndDelete(req.params.id);
   if (!court) return res.status(404).json({ message: 'Không tìm thấy sân.' });
   res.json({ message: 'Đã xóa sân thành công.' });
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
