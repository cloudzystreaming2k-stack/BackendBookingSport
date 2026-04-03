import mongoose from 'mongoose';

const courtPricingSchema = new mongoose.Schema({
   court: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Court',
      required: true
   },
   dayOfWeek: {
      type: Number,
      required: true,
      min: 0,  // 0 = Chủ Nhật (chuẩn JS getDay())
      max: 6   // 6 = Thứ 7
   },
   startTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format giờ không hợp lệ (HH:MM)']
   },
   endTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format giờ không hợp lệ (HH:MM)']
   },
   price: {
      type: Number,
      required: true,
      min: [0, 'Giá không thể âm']
   },
   isActive: {
      type: Boolean,
      default: true
   }
}, { timestamps: true });

// Compound unique index: không thể trùng (sân + ngày + giờ bắt đầu)
courtPricingSchema.index(
   { court: 1, dayOfWeek: 1, startTime: 1 },
   { unique: true }
);

// Index phụ để query nhanh theo sân
courtPricingSchema.index({ court: 1, isActive: 1 });

const CourtPricing = mongoose.model('CourtPricing', courtPricingSchema);
export default CourtPricing;
