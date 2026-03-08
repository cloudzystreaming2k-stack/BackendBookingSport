import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from './models/User.model.js';
import { connectDB } from './config/db.js';

const seedAdmin = async () => {
   try {
      await connectDB();

      // Kiểm tra xem Admin đã tồn tại chưa
      const adminExists = await User.findOne({ role: 'admin' });

      if (adminExists) {
         console.log('⚠️ Tài khoản Admin đã tồn tại trong hệ thống.');
         process.exit();
      }

      const adminData = {
         name: 'Quản trị viên Hệ thống',
         email: 'admin@sportbooking.vn',
         password: 'admin123', // Mật khẩu sẽ tự động được băm nhờ hook pre-save trong Model
         phone: '0901234567',
         role: 'admin'
      };

      const createdAdmin = await User.create(adminData);

      console.log('✅ Đã tạo tài khoản Admin thành công!');
      console.log(`📧 Email: ${createdAdmin.email}`);
      console.log(`🔑 Mật khẩu: adminpassword123`);

      process.exit();
   } catch (error) {
      console.error(`❌ Lỗi khi khởi tạo Admin: ${error.message}`);
      process.exit(1);
   }
};

seedAdmin();
