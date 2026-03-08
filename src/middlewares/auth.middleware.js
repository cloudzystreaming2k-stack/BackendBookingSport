import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

/**
 * Middleware bảo vệ route - Yêu cầu Access Token hợp lệ trong Bearer Header
 */
export const protect = async (req, res, next) => {
   const authHeader = req.headers.authorization;

   if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Không có quyền truy cập. Vui lòng đăng nhập.' });
   }

   const token = authHeader.split(' ')[1];

   try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
         return res.status(401).json({ message: 'Người dùng không tồn tại.' });
      }

      // Kiểm tra nếu user đã logout (refreshToken rỗng = phiên đã kết thúc)
      if (!user.refreshToken) {
         return res.status(401).json({ message: 'Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.' });
      }

      // Loại bỏ thông tin nhạy cảm trước khi gán vào req
      user.password = undefined;
      user.refreshToken = undefined;
      req.user = user;

      next();
   } catch (error) {
      if (error.name === 'TokenExpiredError') {
         return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
      }
      return res.status(401).json({ message: 'Token không hợp lệ.' });
   }
};

/**
 * Middleware kiểm tra quyền Admin
 */
export const adminOnly = (req, res, next) => {
   if (req.user && req.user.role === 'admin') {
      return next();
   }
   return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này.' });
};
