import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
   bookingCode: { type: String, unique: true }, // BK001, BK002...
   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
   courtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Court', required: true },
   bookingDate: { type: Date, required: true },
   startTime: { type: String, required: true }, // "18:00"
   endTime: { type: String, required: true },   // "20:00"
   totalPrice: { type: Number, required: true },
   status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending'
   },
   paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid'
   },
   paymentMethod: { type: String, default: '' },
   notes: { type: String, default: '' },
}, { timestamps: true });

// Tự động tạo mã booking trước khi save
bookingSchema.pre('save', async function (next) {
   if (!this.bookingCode) {
      const count = await mongoose.model('Booking').countDocuments();
      this.bookingCode = `BK${String(count + 1).padStart(3, '0')}`;
   }
   next();
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
