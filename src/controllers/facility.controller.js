import asyncHandler from 'express-async-handler';
import Facility from '../models/Facility.model.js';

// @desc    Lấy danh sách tất cả tiện ích
// @route   GET /api/admin/facilities
// @access  Private/Admin
export const getAllFacilities = asyncHandler(async (req, res) => {
   const facilities = await Facility.find({}).sort({ createdAt: -1 });
   res.json(facilities);
});

// @desc    Tạo mới một tiện ích
// @route   POST /api/admin/facilities
// @access  Private/Admin
export const createFacility = asyncHandler(async (req, res) => {
   const { name, icon, description } = req.body;

   const facilityExists = await Facility.findOne({ name });
   if (facilityExists) {
      res.status(400);
      throw new Error('Tên tiện ích này đã tồn tại');
   }

   const facility = await Facility.create({
      name,
      icon,
      description,
   });

   if (facility) {
      res.status(201).json(facility);
   } else {
      res.status(400);
      throw new Error('Dữ liệu tiện ích không hợp lệ');
   }
});

// @desc    Cập nhật tiện ích
// @route   PUT /api/admin/facilities/:id
// @access  Private/Admin
export const updateFacility = asyncHandler(async (req, res) => {
   let facility = await Facility.findById(req.params.id);

   if (!facility) {
      res.status(404);
      throw new Error('Không tìm thấy tiện ích');
   }

   const { name, icon, description } = req.body;

   // Nếu sửa tên, kiểm tra trùng lặp với tên của tiện ích khác
   if (name && name !== facility.name) {
      const exists = await Facility.findOne({ name });
      if (exists) {
         res.status(400);
         throw new Error('Tên tiện ích này đã được sử dụng bởi một tiện ích khác');
      }
   }

   facility.name = name || facility.name;
   facility.icon = icon !== undefined ? icon : facility.icon;
   facility.description = description !== undefined ? description : facility.description;

   const updatedFacility = await facility.save();
   res.json(updatedFacility);
});

// @desc    Xóa tiện ích
// @route   DELETE /api/admin/facilities/:id
// @access  Private/Admin
export const deleteFacility = asyncHandler(async (req, res) => {
   const facility = await Facility.findById(req.params.id);

   if (!facility) {
      res.status(404);
      throw new Error('Không tìm thấy tiện ích');
   }

   await facility.deleteOne();
   res.json({ message: 'Đã xóa tiện ích thành công' });
});
