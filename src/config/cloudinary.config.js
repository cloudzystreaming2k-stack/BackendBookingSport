import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import 'dotenv/config';

// Cấu hình kết nối Cloudinary
cloudinary.config({
   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
   api_key: process.env.CLOUDINARY_API_KEY,
   api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage cho ảnh sân
export const courtStorage = new CloudinaryStorage({
   cloudinary,
   params: {
      folder: 'datsanthethao/courts',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      // Dùng Cloudinary AI: Tự động fill 1920x1080 nhưng giữ lại điểm lấy nét quan trọng nhất (gravity auto)
      transformation: [{ width: 1920, height: 1080, crop: 'fill', gravity: 'auto', quality: 'auto:best', fetch_format: 'auto' }],
   },
});

// Storage cho avatar người dùng (dùng sau)
export const avatarStorage = new CloudinaryStorage({
   cloudinary,
   params: {
      folder: 'datsanthethao/avatars',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' }],
   },
});

export default cloudinary;
