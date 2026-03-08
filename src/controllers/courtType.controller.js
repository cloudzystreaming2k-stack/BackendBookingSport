import Court from '../models/Court.model.js';
import CourtType from '../models/CourtType.model.js';
import asyncHandler from 'express-async-handler';

// @desc    Lấy tất cả loại sân + đếm số sân mỗi loại
// @route   GET /api/admin/court-types
// @access  Admin
export const getAllCourtTypes = asyncHandler(async (req, res) => {
   const courtTypes = await CourtType.find({}).sort({ createdAt: -1 }).lean();

   // Đếm số Court cho mỗi CourtType bằng aggregate
   const courtCounts = await Court.aggregate([
      { $group: { _id: '$typeId', count: { $sum: 1 } } },
   ]);

   const countMap = {};
   courtCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
   });

   const result = courtTypes.map((ct) => ({
      ...ct,
      courtCount: countMap[ct._id.toString()] || 0,
   }));

   res.json(result);
});

// @desc    Tạo loại sân mới
// @route   POST /api/admin/court-types
// @access  Admin
export const createCourtType = asyncHandler(async (req, res) => {
   const { name, icon, color, minPlayers, maxPlayers } = req.body;

   const exists = await CourtType.findOne({ name });
   if (exists) {
      return res.status(400).json({ message: `Loại sân "${name}" đã tồn tại.` });
   }

   const courtType = await CourtType.create({ name, icon, color, minPlayers, maxPlayers });
   res.status(201).json({ ...courtType.toObject(), courtCount: 0 });
});

// @desc    Cập nhật loại sân
// @route   PUT /api/admin/court-types/:id
// @access  Admin
export const updateCourtType = asyncHandler(async (req, res) => {
   const courtType = await CourtType.findById(req.params.id);
   if (!courtType) return res.status(404).json({ message: 'Không tìm thấy loại sân.' });

   const { name, icon, color, minPlayers, maxPlayers } = req.body;
   if (name !== undefined) courtType.name = name;
   if (icon !== undefined) courtType.icon = icon;
   if (color !== undefined) courtType.color = color;
   if (minPlayers !== undefined) courtType.minPlayers = minPlayers;
   if (maxPlayers !== undefined) courtType.maxPlayers = maxPlayers;

   const updated = await courtType.save();

   const courtCount = await Court.countDocuments({ typeId: updated._id });
   res.json({ ...updated.toObject(), courtCount });
});

// @desc    Xóa loại sân (chặn nếu còn sân đang dùng)
// @route   DELETE /api/admin/court-types/:id
// @access  Admin
export const deleteCourtType = asyncHandler(async (req, res) => {
   const courtType = await CourtType.findById(req.params.id);
   if (!courtType) return res.status(404).json({ message: 'Không tìm thấy loại sân.' });

   const courtCount = await Court.countDocuments({ typeId: courtType._id });
   if (courtCount > 0) {
      return res.status(400).json({
         message: `Không thể xóa. Hiện có ${courtCount} sân đang thuộc loại "${courtType.name}".`,
      });
   }

   await CourtType.findByIdAndDelete(req.params.id);
   res.json({ message: `Đã xóa loại sân "${courtType.name}" thành công.` });
});
