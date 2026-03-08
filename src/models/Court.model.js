import mongoose from 'mongoose';

const courtSchema = new mongoose.Schema({
   name: { type: String, required: true, trim: true },
   typeId: { type: mongoose.Schema.Types.ObjectId, ref: 'CourtType', required: true },
   address: { type: String, required: true },
   district: { type: String, required: true },
   pricePerHour: { type: Number, required: true },
   description: { type: String, default: '' },
   images: [{ type: String }],
   facilities: [{ type: String }], // ['Wifi', 'Gửi xe', 'Căng tin'...]
   rating: { type: Number, default: 0, min: 0, max: 5 },
   reviewCount: { type: Number, default: 0 },
   isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Court = mongoose.model('Court', courtSchema);
export default Court;
