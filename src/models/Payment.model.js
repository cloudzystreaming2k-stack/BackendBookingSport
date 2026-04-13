import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
   bookingId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Booking', 
      required: true,
      unique: true // Mỗi đơn đặt sân chỉ có 1 bản ghi payment vì mình không có flow hoàn tiền/cọc nhiều lần
   },
   amount: { 
      type: Number, 
      required: true 
   }, // Số tiền thực thu
   paymentMethod: { 
      type: String, 
      enum: ['cash', 'momo', 'vnpay'],
      required: true 
   }, // Phương thức thực lưu lúc admin thu
   status: { 
      type: String, 
      enum: ['paid'], // Bỏ refunded
      default: 'paid' 
   },
   paidAt: { 
      type: Date, 
      default: Date.now 
   }, // Thời điểm thu tiền
   createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: false // Không bắt buộc vì thanh toán tự động (VNPay/Momo) do hệ thống tự sinh
   }, // ID của Admin xác nhận thanh toán (nếu là cash)
   transactionId: {
      type: String,
      default: null 
   }, // VD: Mã giao dịch trả về từ ngân hàng / VNPay
   gatewayTxnRef: {
      type: String,
      default: null
   }, // VD: Mã tham chiếu gửi sang cổng thanh toán (Booking ID)
   notes: { 
      type: String, 
      default: '' 
   }
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
