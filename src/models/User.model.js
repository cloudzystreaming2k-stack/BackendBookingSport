import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
   firstName: { type: String, required: true, trim: true }, // Tên (VD: Tuấn)
   lastName:  { type: String, required: true, trim: true }, // Họ và đệm (VD: Nguyễn Minh)
   email: { type: String, required: true, unique: true, lowercase: true },
   password: { type: String, minlength: 6 },
   phone: { type: String, default: '' },
   gender: { type: String, enum: ['male', 'female', 'other'] },
   dateOfBirth: { type: Date },
   role: { type: String, enum: ['user', 'admin', 'owner'], default: 'user' },
   status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
   isActive: { type: Boolean, default: true },
   ownerInfo: {
      ownerName: { type: String, trim: true },
      identityNumber: { type: String, trim: true },
      businessName: { type: String, trim: true },
      taxCode: { type: String, trim: true },
      businessAddress: { type: String, trim: true },
      businessPhone: { type: String, trim: true },
      bankName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      accountOwner: { type: String, trim: true }
   },
   avatar: { type: String, default: '' },
   refreshToken: { type: String, default: '' }, // Lưu Refresh Token để kiểm tra (rotation)
}, { timestamps: true });

// Tự động băm mật khẩu trước khi lưu
userSchema.pre('save', async function () {
   if (!this.isModified('password') || !this.password) return;
   const salt = await bcrypt.genSalt(10);
   this.password = await bcrypt.hash(this.password, salt);
});

// Method so sánh mật khẩu
userSchema.methods.matchPassword = async function (enteredPassword) {
   if (!this.password) return false;
   return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
