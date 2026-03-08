import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
   name: { type: String, required: true, trim: true },
   email: { type: String, required: true, unique: true, lowercase: true },
   password: { type: String, required: true, minlength: 6 },
   phone: { type: String, default: '' },
   role: { type: String, enum: ['user', 'admin'], default: 'user' },
   avatar: { type: String, default: '' },
   refreshToken: { type: String, default: '' }, // Lưu Refresh Token để kiểm tra (rotation)
}, { timestamps: true });

// Tự động băm mật khẩu trước khi lưu
userSchema.pre('save', async function () {
   if (!this.isModified('password')) return;
   const salt = await bcrypt.genSalt(10);
   this.password = await bcrypt.hash(this.password, salt);
});

// Method so sánh mật khẩu
userSchema.methods.matchPassword = async function (enteredPassword) {
   return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
