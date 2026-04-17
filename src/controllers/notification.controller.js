import asyncHandler from 'express-async-handler';
import Notification from '../models/Notification.model.js';

/**
 * @desc  Lấy danh sách thông báo của user hiện tại
 * @route GET /api/notifications/my
 * @access Private
 */
export const getMyNotifications = asyncHandler(async (req, res) => {
   const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

   res.json(notifications);
});

/**
 * @desc  Đánh dấu đã đọc một thông báo
 * @route PATCH /api/notifications/:id/read
 * @access Private
 */
export const markOneRead = asyncHandler(async (req, res) => {
   const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id }, // Đảm bảo user chỉ đọc thông báo của mình
      { isRead: true },
      { new: true }
   );

   if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo.' });
   }

   res.json(notification);
});

/**
 * @desc  Đánh dấu đã đọc tất cả thông báo
 * @route PATCH /api/notifications/read-all
 * @access Private
 */
export const markAllRead = asyncHandler(async (req, res) => {
   await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
   );

   res.json({ message: 'Đã đánh dấu tất cả thông báo là đã đọc.' });
});
