import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
   bookingCode: { type: String, unique: true }, // BK001, BK002...
   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
   courtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Court', required: true },
   date: { type: String, required: true }, // "2026-04-10"
   customerName: { type: String, required: true }, // Tên người thực sự đến sân
   customerPhone: { type: String, required: true }, // SĐT liên hệ
   slots: [{
      startTime: { type: String, required: true }, // "08:00"
      endTime: { type: String, required: true },   // "08:30"
      price: { type: Number, required: true }
   }],
   totalPrice: { type: Number, required: true }, // Tổng tiền trước discount
   discountCode: { type: String, default: '' },
   discountAmount: { type: Number, default: 0 },
   finalPrice: { type: Number, required: true }, // Tổng tiền sau discount
   preferredPaymentMethod: {
      type: String,
      enum: ['cash', 'momo', 'vnpay'],
      default: 'cash'
   }, // Phương thức TT user mong muốn
   paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid'
   }, // Dùng để cache trạng thái từ bảng Payment cho dễ query
   status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending'
   },
   notes: { type: String, default: '' },
}, { timestamps: true });

// Tự động tạo mã booking trước khi save
bookingSchema.pre('save', async function (next) {
   if (!this.bookingCode) {
      const count = await mongoose.model('Booking').countDocuments();
      this.bookingCode = `BK${String(count + 1).padStart(3, '0')}`;
   }
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
