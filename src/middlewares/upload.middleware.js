import multer from 'multer';
import { courtStorage, avatarStorage } from '../config/cloudinary.config.js';

const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB

const fileFilter = (req, file, cb) => {
   const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
   if (allowed.includes(file.mimetype)) {
      cb(null, true);
   } else {
      cb(new Error('Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WebP.'), false);
   }
};

const courtUploader = multer({
   storage: courtStorage,
   limits: { fileSize: FILE_SIZE_LIMIT },
   fileFilter,
}).array('images', 5);

const avatarUploader = multer({
   storage: avatarStorage,
   limits: { fileSize: FILE_SIZE_LIMIT },
   fileFilter,
}).single('avatar');

/**
 * Wrap Multer (callback-based) thành Promise để dùng được với async/await
 * Multer errors sẽ được express-async-handler bắt đúng cách
 */
const wrapMulter = (uploaderFn) => (req, res, next) => {
   uploaderFn(req, res, (err) => {
      if (!err) return next();

      // Lỗi file size
      if (err.code === 'LIMIT_FILE_SIZE') {
         return res.status(400).json({ message: 'File ảnh quá lớn. Giới hạn tối đa 5MB mỗi ảnh.' });
      }
      // Lỗi số lượng file
      if (err.code === 'LIMIT_FILE_COUNT') {
         return res.status(400).json({ message: 'Chỉ được upload tối đa 5 ảnh.' });
      }
      // Lỗi Cloudinary hoặc các lỗi khác
      return res.status(400).json({ message: err.message || 'Lỗi upload ảnh.' });
   });
};

// Export middleware đã được wrap
export const uploadCourtImages = wrapMulter(courtUploader);
export const uploadAvatar = wrapMulter(avatarUploader);
