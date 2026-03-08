import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/server.js';
import User from '../src/models/User.model.js';
import { connectDB } from '../src/config/db.js';

describe('Auth API Endpoints', () => {
   let testUser = {
      name: 'Test Member',
      email: 'testauth@example.com',
      password: 'password123',
      phone: '0123456789'
   };

   beforeAll(async () => {
      await connectDB();
      // Đảm bảo kết nối DB đã sẵn sàng
      await User.deleteMany({ email: testUser.email });
   });

   afterAll(async () => {
      await User.deleteMany({ email: testUser.email });
      await mongoose.connection.close();
   });

   it('Sử dụng POST /api/auth/register để tạo user mới', async () => {
      const res = await request(app)
         .post('/api/auth/register')
         .send(testUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.email).toBe(testUser.email);
   });

   it('Sử dụng POST /api/auth/login để đăng nhập', async () => {
      const res = await request(app)
         .post('/api/auth/login')
         .send({
            email: testUser.email,
            password: testUser.password
         });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('accessToken');
      // Kiểm tra HttpOnly cookie
      expect(res.headers['set-cookie']).toBeDefined();
   });

   it('Sử dụng GET /api/auth/profile để lấy thông tin (yêu cầu token)', async () => {
      // Trước hết phải login lấy token
      const loginRes = await request(app)
         .post('/api/auth/login')
         .send({
            email: testUser.email,
            password: testUser.password
         });

      const token = loginRes.body.accessToken;

      const res = await request(app)
         .get('/api/auth/profile')
         .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.email).toBe(testUser.email);
   });

   it('Sử dụng POST /api/auth/logout để đăng xuất', async () => {
      const res = await request(app)
         .post('/api/auth/logout');

      expect(res.statusCode).toEqual(200);
      // Kiểm tra cookie đã bị xóa (max-age=0 hoặc expires trong quá khứ)
      expect(res.headers['set-cookie'][0]).toMatch(/refreshToken=;/);
   });
});
