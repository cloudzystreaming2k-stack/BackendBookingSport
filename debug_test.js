import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import axios from 'axios';
import { connectDB } from './src/config/db.js';
import User from './src/models/User.model.js';

const TEST_URL = 'http://localhost:5000/api';
const testUser = {
   name: 'Debug User',
   email: 'debug@test.com',
   password: 'password123',
   phone: '0999888777'
};

async function runDebug() {
   try {
      console.log('--- Bắt đầu Debug Test ---');
      await connectDB();

      // 1. Xóa user cũ
      await User.deleteMany({ email: testUser.email });
      console.log('1. Đã xóa user cũ nếu có');

      // 2. Test Register qua API (giả sử server đang chạy)
      console.log('2. Đang test Register...');
      try {
         const regRes = await axios.post(`${TEST_URL}/auth/register`, testUser);
         console.log('✅ Register thành công:', regRes.data);
      } catch (err) {
         console.log('❌ Register thất bại:', err.response?.data || err.message);
      }

      // 3. Test Login
      console.log('3. Đang test Login...');
      let token = '';
      try {
         const loginRes = await axios.post(`${TEST_URL}/auth/login`, {
            email: testUser.email,
            password: testUser.password
         });
         token = loginRes.data.accessToken;
         console.log('✅ Login thành công, Token:', token.substring(0, 20) + '...');
      } catch (err) {
         console.log('❌ Login thất bại:', err.response?.data || err.message);
      }

      // 4. Test Profile
      if (token) {
         console.log('4. Đang test Profile...');
         try {
            const profRes = await axios.get(`${TEST_URL}/auth/profile`, {
               headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Profile thành công:', profRes.data.name);
         } catch (err) {
            console.log('❌ Profile thất bại:', err.response?.data || err.message);
         }
      }

      await mongoose.connection.close();
      console.log('--- Kết thúc Debug Test ---');
   } catch (error) {
      console.error('Lỗi nghiêm trọng:', error);
      process.exit(1);
   }
}

runDebug();
