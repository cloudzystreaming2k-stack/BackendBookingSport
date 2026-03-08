import Booking from '../models/Booking.model.js';
import Court from '../models/Court.model.js';
import asyncHandler from 'express-async-handler';

// @desc    Tạo đơn đặt sân mới
// @route   POST /api/bookings
// @access  Private
export const createBooking = asyncHandler(async (req, res) => {
   const { courtId, bookingDate, startTime, endTime } = req.body;

   const court = await Court.findById(courtId);
   if (!court) return res.status(404).json({ message: 'Không tìm thấy sân.' });

   // Kiểm tra trùng lịch
   const conflict = await Booking.findOne({
      courtId,
      bookingDate: new Date(bookingDate),
      status: { $in: ['pending', 'confirmed'] },
      $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
   });
   if (conflict) return res.status(409).json({ message: 'Khung giờ này đã được đặt. Vui lòng chọn giờ khác.' });

   const [sh, sm] = startTime.split(':').map(Number);
   const [eh, em] = endTime.split(':').map(Number);
   const hours = (eh * 60 + em - (sh * 60 + sm)) / 60;
   const totalPrice = hours * court.pricePerHour;

   const booking = await Booking.create({
      userId: req.user._id,
      courtId,
      bookingDate: new Date(bookingDate),
      startTime,
      endTime,
      totalPrice,
   });

   res.status(201).json(booking);
});

// @desc    Lấy danh sách lịch đặt của tôi
// @route   GET /api/bookings/my-bookings
// @access  Private
export const getMyBookings = asyncHandler(async (req, res) => {
   const bookings = await Booking.find({ userId: req.user._id })
      .populate('courtId', 'name address images pricePerHour')
      .sort({ createdAt: -1 });
   res.json(bookings);
});
