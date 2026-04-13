import Booking from '../models/Booking.model.js';
import Court from '../models/Court.model.js';
import CourtPricing from '../models/CourtPricing.model.js';
import asyncHandler from 'express-async-handler';

/**
 * @desc    Tạo đơn đặt sân mới
 * @route   POST /api/bookings
 * @access  Private
 * @body    { courtId, date, slots[], customerName, customerPhone, notes, preferredPaymentMethod, totalPrice, discountCode, discountAmount, finalPrice }
 */
export const createBooking = asyncHandler(async (req, res) => {
   const {
      courtId,
      date,
      slots,
      customerName,
      customerPhone,
      notes,
      preferredPaymentMethod = 'cash',
      totalPrice,
      discountCode,
      discountAmount,
      finalPrice
   } = req.body;

   // Validate required fields
   if (!courtId || !date || !slots || slots.length === 0) {
      return res.status(400).json({
         message: 'Vui lòng cung cấp courtId, date, và slots[]'
      });
   }

   if (!customerName || !customerPhone) {
      return res.status(400).json({
         message: 'Vui lòng cung cấp tên và số điện thoại'
      });
   }

   // Validate court exists
   const court = await Court.findById(courtId);
   if (!court) {
      return res.status(404).json({ message: 'Không tìm thấy sân.' });
   }

   // Validate phone format (VN: bắt đầu 0, 10 số)
   const phoneRegex = /^0\d{9}$/;
   if (!phoneRegex.test(customerPhone)) {
      return res.status(400).json({
         message: 'Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng.'
      });
   }

   // --- DATA & PRICE VALIDATION ---
   const dayOfWeek = new Date(date).getDay();

   const pricingSlots = await CourtPricing.find({
      court: courtId,
      dayOfWeek,
      isActive: true
   }).lean();

   if (pricingSlots.length === 0) {
      // Auto-seed if not exist yet for this court (as a fallback)
      const { initDefaultPricing } = await import('./pricing.controller.js');
      await initDefaultPricing(courtId);
      // Wait a bit or proceed, but standard behavior returns an error first
      return res.status(400).json({
         message: 'Lịch giá của sân chưa được đồng bộ hoàn tất, vui lòng thử lại sau.'
      });
   }

   let calculatedTotalPrice = 0;
   const verifiedSlots = [];

   // Conflict check & price accumulation: Kiểm tra từng slot
   for (const slot of slots) {
      // 1. Trích xuất giá chuẩn của Backend dựa trên startTime
      const pricingObj = pricingSlots.find(p => p.startTime === slot.time || p.startTime === slot.startTime);
      if (!pricingObj) {
         return res.status(400).json({
            message: `Khung giờ ${slot.startTime || slot.time} không hợp lệ với thiết lập của sân.`
         });
      }

      const realPrice = pricingObj.price;
      calculatedTotalPrice += realPrice;

      const st = pricingObj.startTime;
      const et = pricingObj.endTime;

      verifiedSlots.push({
         startTime: st,
         endTime: et,
         price: realPrice
      });

      // 2. Conflict check
      const conflict = await Booking.findOne({
         courtId,
         date,
         status: { $in: ['pending', 'confirmed'] },
         slots: {
            $elemMatch: {
               startTime: { $lt: et },
               endTime: { $gt: st }
            }
         }
      });

      if (conflict) {
         return res.status(409).json({
            message: `Khung giờ ${st}-${et} đã được đặt. Vui lòng chọn giờ khác.`,
            conflictSlot: slot
         });
      }
   }

   // Áp dụng tính toán Discount
   let calculatedDiscountAmount = 0;
   let validDiscountCode = '';

   if (discountCode) {
      const code = discountCode.toString().trim().toUpperCase();
      const validCodes = {
         'SPORT10': 10,
         'SPORT20': 20
      };

      if (validCodes[code]) {
         validDiscountCode = code;
         calculatedDiscountAmount = (calculatedTotalPrice * validCodes[code]) / 100;
      }
   }

   const calculatedFinalPrice = Math.max(0, calculatedTotalPrice - calculatedDiscountAmount);

   // Create booking
   const booking = await Booking.create({
      userId: req.user._id,
      courtId,
      date,
      customerName,
      customerPhone,
      slots: verifiedSlots,
      totalPrice: calculatedTotalPrice,
      discountCode: validDiscountCode,
      discountAmount: calculatedDiscountAmount,
      finalPrice: calculatedFinalPrice,
      preferredPaymentMethod,
      notes: notes || '',
      status: 'pending'
   });

   res.status(201).json({
      message: 'Đơn đặt sân đã được tạo. Đang chờ Admin xác nhận.',
      booking
   });
});

/**
 * @desc    Lấy danh sách lịch đặt của user hiện tại
 * @route   GET /api/bookings/my
 * @access  Private
 */
export const getMyBookings = asyncHandler(async (req, res) => {
   const bookings = await Booking.find({ userId: req.user._id })
      .populate({
         path: 'courtId',
         select: 'name address images mainImage code typeId',
         populate: {
            path: 'typeId',
            select: 'name color icon'
         }
      })
      .sort({ createdAt: -1 });
   res.json(bookings);
});

/**
 * @desc    Lấy chi tiết một đơn đặt sân
 * @route   GET /api/bookings/:id
 * @access  Private (Verify user ownership or admin)
 */
export const getBookingById = asyncHandler(async (req, res) => {
   const booking = await Booking.findById(req.params.id)
      .populate({
         path: 'courtId',
         select: 'name address images mainImage code typeId',
         populate: {
            path: 'typeId',
            select: 'name color icon'
         }
      })
      .populate('userId', 'email phone fullName');

   if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đặt sân.' });
   }

   // Verify user ownership (user chỉ xem được booking của mình, trừ admin)
   if (booking.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền xem đơn này.' });
   }

   res.json(booking);
});
