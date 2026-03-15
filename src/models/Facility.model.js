import mongoose from 'mongoose';

const facilitySchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, 'Vui lòng nhập tên tiện ích'],
      unique: true,
      trim: true,
   },
   icon: {
      type: String,
      default: '🏷️',
      trim: true,
   },
   description: {
      type: String,
      default: '',
   },
}, { timestamps: true });

const Facility = mongoose.model('Facility', facilitySchema);
export default Facility;
