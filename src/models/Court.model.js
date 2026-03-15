import mongoose from 'mongoose';

const courtSchema = new mongoose.Schema({
   name: { type: String, required: true, trim: true },
   code: { type: String, unique: true, sparse: true, trim: true },
   typeId: { type: mongoose.Schema.Types.ObjectId, ref: 'CourtType', required: true },
   address: { type: String, required: true },
   district: { type: String, required: true },
   description: { type: String, default: '' },
   capacity: { type: Number, default: 4, min: 1 },
   openTime: { type: String, default: '06:00' },
   closeTime: { type: String, default: '23:00' },
   pricing: {
      morning: { type: Number, default: 0, min: 0 },   // 06:00 - 12:00
      afternoon: { type: Number, default: 0, min: 0 }, // 12:00 - 18:00
      evening: { type: Number, default: 0, min: 0 },   // 18:00 - 22:00
   },
   status: { type: String, enum: ['active', 'maintenance'], default: 'active' },
   images: [{ type: String }],     // Tối đa 5 URL từ Cloudinary
   mainImage: { type: String },    // URL ảnh đại diện (phải nằm trong mảng images)
   facilities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Facility' }], // Liên kết tới bảng Facility
   isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Court = mongoose.model('Court', courtSchema);
export default Court;
