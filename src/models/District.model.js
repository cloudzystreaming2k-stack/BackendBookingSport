import mongoose from 'mongoose';

const districtSchema = new mongoose.Schema({
   code: { type: Number, required: true, unique: true },   // Mã huyện (ví dụ: 760 = Quận 1)
   name: { type: String, required: true, trim: true },     // Tên đầy đủ
   codename: { type: String, trim: true },                  // Slug: quan-1
   provinceCode: { type: Number, required: true, index: true }, // Mã tỉnh cha
}, { timestamps: false, versionKey: false });

districtSchema.index({ provinceCode: 1, name: 1 });

const District = mongoose.model('District', districtSchema);
export default District;
