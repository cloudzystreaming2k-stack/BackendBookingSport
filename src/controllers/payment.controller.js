import Payment from '../models/Payment.model.js';
import Booking from '../models/Booking.model.js';
import asyncHandler from 'express-async-handler';
import moment from 'moment';
import qs from 'qs';
import crypto from 'crypto';

/**
 * @desc    Admin xác nhận đã thu tiền (Tạo record Payment & update Booking)
 * @route   POST /api/admin/payments
 * @access  Admin
 * @body    { bookingId, amount, paymentMethod, notes }
 */
export const createPayment = asyncHandler(async (req, res) => {
   const { bookingId, amount, paymentMethod, notes } = req.body;

   if (!bookingId || amount === undefined || !paymentMethod) {
      return res.status(400).json({ message: 'Vui lòng cung cấp bookingId, amount và paymentMethod' });
   }

   // Validate booking exists
   const booking = await Booking.findById(bookingId);
   if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đặt sân' });
   }

   // Kiểm tra xem đã thanh toán chưa (để tránh tạo duplicate 2 lần cho 1 đơn)
   const existingPayment = await Payment.findOne({ bookingId });
   if (existingPayment) {
      return res.status(409).json({ message: 'Đơn đặt sân này đã được thanh toán rồi' });
   }

   // 1. Tạo Payment record
   const payment = await Payment.create({
      bookingId,
      amount,
      paymentMethod,
      notes: notes || '',
      createdBy: req.user._id,
      status: 'paid'
   });

   // 2. Cập nhật paymentStatus của Booking thành 'paid'
   booking.paymentStatus = 'paid';
   await booking.save();

   res.status(201).json({
      message: 'Đã xác nhận thu tiền thành công',
      payment
   });
});

/**
 * @desc    Lấy thông tin thanh toán của 1 đơn đặt sân
 * @route   GET /api/admin/payments/booking/:bookingId
 * @access  Admin/User
 */
export const getPaymentByBooking = asyncHandler(async (req, res) => {
   const payment = await Payment.findOne({ bookingId: req.params.bookingId })
      .populate('createdBy', 'fullName email');

   if (!payment) {
      return res.status(404).json({ message: 'Đơn đặt sân này chưa có lịch sử thanh toán' });
   }

   // Tùy chọn: chặn user xem payment của người khác (nếu cần bảo mật strict)
   // const booking = await Booking.findById(req.params.bookingId);
   // if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') { ... }

   res.json({ payment });
});

/**
 * @desc    Tạo URL thanh toán VNPay
 * @route   POST /api/payments/vnpay/create-payment-url
 * @access  Private
 * @body    { bookingId, bankCode (optional) }
 */
export const createVNPayUrl = asyncHandler(async (req, res) => {
   const { bookingId, bankCode } = req.body;

   const booking = await Booking.findById(bookingId);
   if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đặt sân' });
   }

   if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Đơn đặt sân này đã được thanh toán' });
   }

   const tmnCode = process.env.VNP_TMN_CODE || 'DEMOCODE'; // Thay bằng VNP_TMNCODE thật
   const secretKey = process.env.VNP_HASH_SECRET || 'DEMOSECRET1234567890';
   const vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
   // Tự động nhận diện host (localhost hoặc domain trên Render)
   const returnUrl = process.env.VNP_RETURN_URL || `${req.headers['x-forwarded-proto'] || req.protocol}://${req.get('host')}/api/payments/vnpay/return`;

   const date = new Date();
   // VNPay yêu cầu thời gian mặc định là GMT+7 (Asia/Ho_Chi_Minh)
   const createDate = moment(date).utcOffset('+07:00').format('YYYYMMDDHHmmss');
   const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.ip;

   const amount = booking.finalPrice; // Số tiền từ booking
   const orderId = booking._id.toString();

   let vnp_Params = {};
   vnp_Params['vnp_Version'] = '2.1.0';
   vnp_Params['vnp_Command'] = 'pay';
   vnp_Params['vnp_TmnCode'] = tmnCode;
   vnp_Params['vnp_Locale'] = 'vn';
   vnp_Params['vnp_CurrCode'] = 'VND';
   vnp_Params['vnp_TxnRef'] = orderId;
   vnp_Params['vnp_OrderInfo'] = 'Thanh toan don dat san: ' + orderId;
   vnp_Params['vnp_OrderType'] = 'other';
   vnp_Params['vnp_Amount'] = amount * 100; // VNPAY yêu cầu nhân 100 (bỏ 2 số thập phân)
   vnp_Params['vnp_ReturnUrl'] = returnUrl;
   vnp_Params['vnp_IpAddr'] = ipAddr;
   vnp_Params['vnp_CreateDate'] = createDate;

   if (bankCode !== null && bankCode !== '' && bankCode !== undefined) {
      vnp_Params['vnp_BankCode'] = bankCode;
   }

   // Sort array params vnpay
   vnp_Params = sortObject(vnp_Params);

   const signData = qs.stringify(vnp_Params, { encode: false });
   const hmac = crypto.createHmac('sha512', secretKey);
   const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

   vnp_Params['vnp_SecureHash'] = signed;
   const paymentUrl = vnpUrl + '?' + qs.stringify(vnp_Params, { encode: false });

   res.json({ paymentUrl });
});

/**
 * @desc    Xử lý kết quả giao dịch VNPay trả về
 * @route   GET /api/payments/vnpay/return
 * @access  Public
 */
export const vnpayReturn = asyncHandler(async (req, res) => {
   let vnp_Params = { ...req.query };

   const secureHash = vnp_Params['vnp_SecureHash'];

   // Xóa các key không thuộc payload để sign signature
   delete vnp_Params['vnp_SecureHash'];
   delete vnp_Params['vnp_SecureHashType'];

   vnp_Params = sortObject(vnp_Params);

   const secretKey = process.env.VNP_HASH_SECRET || 'DEMOSECRET1234567890';
   const signData = qs.stringify(vnp_Params, { encode: false });
   const hmac = crypto.createHmac('sha512', secretKey);
   const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

   const bookingId = vnp_Params['vnp_TxnRef'];
   const responseCode = vnp_Params['vnp_ResponseCode'];

   // Thay bằng Base URL Frontend Local của anh, tự động loại bỏ dấu "/" ở cuối nếu lỡ nhập dư
   const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

   // Lấy booking code để hiển thị cho thân thiện thay vì ObjectID của MongoDB
   let displayCode = bookingId;
   try {
      const bookingRecord = await Booking.findById(bookingId);
      if (bookingRecord && bookingRecord.bookingCode) {
         displayCode = bookingRecord.bookingCode;
      }
   } catch (err) {
      console.error("Không tìm thấy booking hoặc lỗi ObjectId:", err);
   }

   if (secureHash === signed) {
      // Hash hợp lệ
      if (responseCode === '00') {
         // Kịch bản Thành công (Happy Path)
         const booking = await Booking.findById(bookingId);

         // Bảo mật: Kiểm tra số tiền trả về có khớp với DB không (đề phòng giá bị đổi trong lúc đợi thanh toán)
         const vnpAmount = vnp_Params['vnp_Amount'] / 100;
         if (booking && vnpAmount !== booking.finalPrice) {
            return res.redirect(`${frontendUrl}/booking-success/${displayCode}?status=failed&reason=amount_mismatch`);
         }

         if (booking && booking.paymentStatus !== 'paid') {
            booking.paymentStatus = 'paid';
            booking.preferredPaymentMethod = 'vnpay';

            try {
               // Tạo Payment record trước để đảm bảo Schema chuẩn xác
               await Payment.create({
                  bookingId: booking._id,
                  amount: vnpAmount,
                  paymentMethod: 'vnpay',
                  // Bỏ qua trường createdBy do đây là hệ thống tự động ghi nhận
                  transactionId: vnp_Params['vnp_TransactionNo'],
                  gatewayTxnRef: vnp_Params['vnp_TxnRef'],
                  status: 'paid',
                  notes: 'Thanh toán điện tử tự động qua Hệ thống VNPay'
               });

               // Lưu Booking sau cùng
               await booking.save();
            } catch (err) {
               console.error("Lỗi khi lưu giao dịch VNPay: ", err);
               return res.redirect(`${frontendUrl}/booking-success/${displayCode}?status=failed&reason=database_error`);
            }
         }

         return res.redirect(`${frontendUrl}/booking-success/${displayCode}?status=success`);
      } else {
         // Kịch bản khách hàng Hủy (Cancel Path) hoặc lỗi khác
         return res.redirect(`${frontendUrl}/booking-success/${displayCode}?status=failed&reason=cancelled`);
      }
   } else {
      // Kịch bản chữ ký giả mạo (Tampered Data)
      return res.redirect(`${frontendUrl}/booking-success/${displayCode}?status=failed&reason=invalid_checksum`);
   }
});

// Hàm hỗ trợ sắp xếp Object theo chuẩn VNPAY
function sortObject(obj) {
   let sorted = {};
   let str = [];
   for (let key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
         str.push(encodeURIComponent(key));
      }
   }
   str.sort();
   for (let key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
   }
   return sorted;
}
