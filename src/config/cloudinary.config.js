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
      transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }],
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
