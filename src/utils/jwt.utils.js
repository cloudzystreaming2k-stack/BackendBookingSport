import jwt from 'jsonwebtoken';

/**
 * Tạo Access Token (ngắn hạn - 15 phút)
 */
export const generateAccessToken = (payload) => {
   return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m',
   });
};

/**
 * Tạo Refresh Token (dài hạn - 7 ngày)
 */
export const generateRefreshToken = (payload) => {
   return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d',
   });
};

/**
 * Gán Refresh Token vào HttpOnly Cookie
 */
export const setRefreshTokenCookie = (res, token) => {
   res.cookie('refreshToken', token, {
      httpOnly: true,         // JavaScript không thể đọc được
      secure: process.env.NODE_ENV === 'production', // Chỉ HTTPS trong production
      sameSite: 'strict',     // Chống CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày (tính bằng ms)
   });
};

/**
 * Xóa Refresh Token Cookie (khi logout)
 */
export const clearRefreshTokenCookie = (res) => {
   res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0), // Đặt thời gian hết hạn về quá khứ
   });
};
