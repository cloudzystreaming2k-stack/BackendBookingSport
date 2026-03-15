import Court from '../models/Court.model.js';
import asyncHandler from 'express-async-handler';

// @desc    Lấy danh sách sân (có filter) - Public
// @route   GET /api/courts
// @access  Public
export const getCourts = asyncHandler(async (req, res) => {
   const { type, district, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

   const filter = { isActive: true, status: 'active' };
   if (type) filter.typeId = type;
   if (district) filter.district = { $regex: district, $options: 'i' };
   if (minPrice || maxPrice) {
      filter['pricing.morning'] = {};
      if (minPrice) filter['pricing.morning'].$gte = Number(minPrice);
      if (maxPrice) filter['pricing.morning'].$lte = Number(maxPrice);
   }

   const total = await Court.countDocuments(filter);
   const courts = await Court.find(filter)
      .populate('typeId', 'name icon color')
      .populate('facilities', 'name icon')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

   res.json({ courts, total, page: Number(page), totalPages: Math.ceil(total / limit) });
});

// @desc    Lấy chi tiết 1 sân - Public
// @route   GET /api/courts/:id
// @access  Public
export const getCourtById = asyncHandler(async (req, res) => {
   const court = await Court.findById(req.params.id)
      .populate('typeId', 'name icon color minPlayers maxPlayers')
      .populate('facilities', 'name icon description');
   if (!court) return res.status(404).json({ message: 'Không tìm thấy sân.' });
   res.json(court);
});

// ─── ADMIN HANDLERS ───────────────────────────────────────────────────────────

import cloudinary from '../config/cloudinary.config.js';

// @desc    Lấy tất cả sân (admin - bao gồm ẩn)
// @route   GET /api/admin/courts
// @access  Admin
export const getAllCourts = asyncHandler(async (req, res) => {
   const { typeId, status, district, search } = req.query;

   const filter = {};
   if (typeId) filter.typeId = typeId;
   if (status) filter.status = status;
   if (district) filter.district = { $regex: district, $options: 'i' };
   if (search) filter.name = { $regex: search, $options: 'i' };

   const courts = await Court.find(filter)
      .populate('typeId', 'name icon color minPlayers maxPlayers')
      .populate('facilities', 'name icon description')
      .sort({ createdAt: -1 })
      .lean();

   res.json(courts);
});

// @desc    Thêm sân mới (có upload ảnh Cloudinary)
// @route   POST /api/admin/courts
// @access  Admin
export const createCourt = asyncHandler(async (req, res) => {
   const {
      name, code, typeId, address, district, description,
      capacity, openTime, closeTime,
      pricingMorning, pricingAfternoon, pricingEvening,
      mainImageIndex, facilities,
   } = req.body;

   // Lấy URL từ Cloudinary - hỗ trợ nhiều version của multer-storage-cloudinary
   const getImageUrl = (f) => f.secure_url || f.path || f.url || '';
   const imageUrls = req.files ? req.files.map(getImageUrl).filter(Boolean) : [];
   const idx = Number(mainImageIndex) || 0;
   const mainImage = imageUrls[idx] || imageUrls[0] || null;

   const facilitiesArr = Array.isArray(facilities)
      ? facilities
      : facilities ? facilities.split(',').map((s) => s.trim()).filter(Boolean) : [];

   const court = await Court.create({
      name, code, typeId, address, district,
      description: description || '',
      capacity: Number(capacity) || 4,
      openTime: openTime || '06:00',
      closeTime: closeTime || '22:00',
      pricing: {
         morning: Number(pricingMorning) || 0,
         afternoon: Number(pricingAfternoon) || 0,
         evening: Number(pricingEvening) || 0,
      },
      images: imageUrls,
      mainImage,
      facilities: facilitiesArr,
   });

   const populated = await court.populate([
      { path: 'typeId', select: 'name icon color' },
      { path: 'facilities', select: 'name icon' }
   ]);
   res.status(201).json(populated);
});

// @desc    Cập nhật sân
// @route   PUT /api/admin/courts/:id
// @access  Admin
export const updateCourt = asyncHandler(async (req, res) => {
   const court = await Court.findById(req.params.id);
   if (!court) return res.status(404).json({ message: 'Không tìm thấy sân.' });

   const {
      name, code, typeId, address, district, description,
      capacity, openTime, closeTime,
      pricingMorning, pricingAfternoon, pricingEvening,
      mainImageIndex, removeImages, facilities, status,
   } = req.body;

   if (name !== undefined) court.name = name;
   if (code !== undefined) court.code = code;
   if (typeId !== undefined) court.typeId = typeId;
   if (address !== undefined) court.address = address;
   if (district !== undefined) court.district = district;
   if (description !== undefined) court.description = description;
   if (capacity !== undefined) court.capacity = Number(capacity);
   if (openTime !== undefined) court.openTime = openTime;
   if (closeTime !== undefined) court.closeTime = closeTime;
   if (status !== undefined) court.status = status;

   if (pricingMorning !== undefined) court.pricing.morning = Number(pricingMorning);
   if (pricingAfternoon !== undefined) court.pricing.afternoon = Number(pricingAfternoon);
   if (pricingEvening !== undefined) court.pricing.evening = Number(pricingEvening);

   if (facilities !== undefined) {
      court.facilities = Array.isArray(facilities)
         ? facilities
         : facilities.split(',').map((s) => s.trim()).filter(Boolean);
   }

   // Xử lý ảnh mới
   if (req.files && req.files.length > 0) {
      const getImageUrl = (f) => f.secure_url || f.path || f.url || '';
      const newUrls = req.files.map(getImageUrl).filter(Boolean);
      let existingImages = [...court.images];

      if (removeImages) {
         const toRemove = Array.isArray(removeImages) ? removeImages : [removeImages];
         for (const publicId of toRemove) {
            await cloudinary.uploader.destroy(publicId).catch(() => null);
         }
         existingImages = existingImages.filter((url) => !toRemove.some((r) => url.includes(r)));
      }
      court.images = [...existingImages, ...newUrls].slice(0, 5);
   }

   // Cập nhật ảnh chính
   if (mainImageIndex !== undefined) {
      court.mainImage = court.images[Number(mainImageIndex)] || court.images[0] || null;
   } else if (court.images.length > 0 && !court.mainImage) {
      court.mainImage = court.images[0];
   }

   const updated = await court.save();
   const populated = await updated.populate([
      { path: 'typeId', select: 'name icon color' },
      { path: 'facilities', select: 'name icon' }
   ]);
   res.json(populated);
});

// @desc    Xóa sân
// @route   DELETE /api/admin/courts/:id
// @access  Admin
export const deleteCourt = asyncHandler(async (req, res) => {
   const court = await Court.findById(req.params.id);
   if (!court) return res.status(404).json({ message: 'Không tìm thấy sân.' });

   // Xóa ảnh trên Cloudinary
   if (court.images && court.images.length > 0) {
      const deletePromises = court.images.map((url) => {
         // Lấy public_id từ URL Cloudinary (ví dụ: datsanthethao/courts/abc123)
         const match = url.match(/datsanthethao\/courts\/([^.]+)/);
         if (match) {
            return cloudinary.uploader.destroy(`datsanthethao/courts/${match[1]}`).catch(() => null);
         }
         return Promise.resolve();
      });
      await Promise.all(deletePromises);
   }

   await Court.findByIdAndDelete(req.params.id);
   res.json({ message: `Đã xóa sân "${court.name}" thành công.` });
});

// @desc    Đổi trạng thái sân
// @route   PATCH /api/admin/courts/:id/status
// @access  Admin
export const toggleCourtStatus = asyncHandler(async (req, res) => {
   const court = await Court.findById(req.params.id);
   if (!court) return res.status(404).json({ message: 'Không tìm thấy sân.' });

   const { status } = req.body;
   if (!['active', 'maintenance'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ. Chỉ chấp nhận: active, maintenance.' });
   }

   court.status = status;
   await court.save();
   res.json({ message: `Đã cập nhật trạng thái thành "${status}".`, status: court.status });
});
