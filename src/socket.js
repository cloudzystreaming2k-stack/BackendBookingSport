import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

/**
 * Map lưu userId → socketId để emit đúng người
 * Dùng in-memory Map (đủ dùng cho single-server deployment)
 */
export const onlineUsers = new Map();

/** Instance io được export để các controller khác dùng */
export let io;

/**
 * Khởi tạo Socket.io, attach vào httpServer
 * @param {import('http').Server} httpServer
 */
export function initSocket(httpServer) {
   io = new Server(httpServer, {
      cors: {
         origin: process.env.CLIENT_URL || 'http://localhost:5173',
         credentials: true,
      },
   });

   io.on('connection', (socket) => {
      // Client gửi token để xác thực danh tính sau khi connect
      socket.on('authenticate', (token) => {
         try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            onlineUsers.set(decoded.id, socket.id);
            console.log(`🔌 Socket authenticated: userId=${decoded.id} socketId=${socket.id}`);
         } catch (error) {
            console.error('Socket Auth Error:', error.message);
            // Token không hợp lệ hoặc hết hạn — bỏ qua, không đăng ký
         }
      });

      socket.on('disconnect', () => {
         // Dọn dẹp Map khi User ngắt kết nối
         onlineUsers.forEach((sid, uid) => {
            if (sid === socket.id) {
               onlineUsers.delete(uid);
               console.log(`🔌 Socket disconnected: userId=${uid}`);
            }
         });
      });
   });

   return io;
}
