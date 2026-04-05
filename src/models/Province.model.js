import mongoose from 'mongoose';

const provinceSchema = new mongoose.Schema({
   code: { type: Number, required: true, unique: true },  // Mã tỉnh (ví dụ: 79 = TP.HCM)
   name: { type: String, required: true, trim: true },    // Tên đầy đủ
   codename: { type: String, trim: true },                 // Slug: thanh-pho-ho-chi-minh
}, { timestamps: false, versionKey: false });

provinceSchema.index({ name: 'text' });

const Province = mongoose.model('Province', provinceSchema);
export default Province;
