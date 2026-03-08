import mongoose from 'mongoose';

const courtTypeSchema = new mongoose.Schema({
   name: { type: String, required: true, unique: true, trim: true },
   icon: { type: String, default: '' },
   color: { type: String, default: 'bg-blue-500' },
   minPlayers: { type: Number, default: 2 },
   maxPlayers: { type: Number, default: 4 },
}, { timestamps: true });

const CourtType = mongoose.model('CourtType', courtTypeSchema);
export default CourtType;
