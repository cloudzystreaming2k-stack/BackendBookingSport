import Court from '../models/Court.model.js';
import CourtPricing from '../models/CourtPricing.model.js';
import asyncHandler from 'express-async-handler';
import { initDefaultPricing, cleanupPricing } from './pricing.controller.js';

// @desc    Lấy danh sách sân (có filter) - Public
// @route   GET /api/courts
// @access  Public
export const getCourts = asyncHandler(async (req, res) => {
   const { type, minPrice, maxPrice, provinceCode, districtCode, page = 1, limit = 10 } = req.query;

   const filter = { isActive: true, status: 'active' };
   if (type) filter.typeId = type;
   if (provinceCode) filter.provinceCode = Number(provinceCode);
   if (districtCode)  filter.districtCode  = Number(districtCode);
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

   // Attach tên tỉnh/huyện bằng local lookup để không cần ObjectId ref
   const { Province, District } = await import('../models/Province.model.js').then(async m => ({
      Province: m.default,
      District: (await import('../models/District.model.js')).default,
   }));
   const obj = court.toObject();
   if (obj.provinceCode) {
      obj.province = await Province.findOne({ code: obj.provinceCode }).select('code name').lean();
   }
   if (obj.districtCode) {
      obj.district = await District.findOne({ code: obj.districtCode }).select('code name').lean();
   }

   res.json(obj);
});

// ─── ADMIN HANDLERS ───────────────────────────────────────────────────────────

import cloudinary from '../config/cloudinary.config.js';

// @desc    Lấy tất cả sân (admin - bao gồm ẩn)
// @route   GET /api/admin/courts
// @access  Admin
export const getAllCourts = asyncHandler(async (req, res) => {
   const { typeId, status, search, provinceCode, districtCode } = req.query;

   const filter = {};
   if (typeId) filter.typeId = typeId;
   if (status) filter.status = status;
   if (search) filter.name = { $regex: search, $options: 'i' };
   if (provinceCode) filter.provinceCode = Number(provinceCode);
   if (districtCode)  filter.districtCode  = Number(districtCode);

   const courts = await Court.find(filter)
      .populate('typeId', 'name icon color minPlayers maxPlayers')
      .populate('facilities')
      .sort({ createdAt: -1 })
      .lean();

   res.json(courts);
});

// @desc    Thêm sân mới (có upload ảnh Cloudinary)
// @route   POST /api/admin/courts
// @access  Admin
export const createCourt = asyncHandler(async (req, res) => {
   const {
      name, code, typeId, address, latitude, longitude, description,
      capacity, openTime, closeTime,
      provinceCode, districtCode,
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
      name, code, typeId, address,
      latitude: Number(latitude),
      longitude: Number(longitude),
      provinceCode: provinceCode ? Number(provinceCode) : null,
      districtCode:  districtCode  ? Number(districtCode)  : null,
      description: description || '',
      capacity: Number(capacity) || 4,
      openTime: openTime || '06:00',
      closeTime: closeTime || '22:00',
      // pricing sẽ được auto-set bởi initDefaultPricing
      images: imageUrls,
      mainImage,
      facilities: facilitiesArr,
   });

   // Seed 238 slots giá mặc định (100k/slot) và sync Court.pricing
   await initDefaultPricing(court._id);

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
      name, code, typeId, address, latitude, longitude, description,
      capacity, openTime, closeTime,
      provinceCode, districtCode,
      mainImageIndex, removeImages, facilities, status,
   } = req.body;

   if (name !== undefined) court.name = name;
   if (code !== undefined) court.code = code;
   if (typeId !== undefined) court.typeId = typeId;
   if (address !== undefined) court.address = address;
   if (latitude !== undefined) court.latitude = Number(latitude);
   if (longitude !== undefined) court.longitude = Number(longitude);
   if (provinceCode !== undefined) court.provinceCode = provinceCode ? Number(provinceCode) : null;
   if (districtCode  !== undefined) court.districtCode  = districtCode  ? Number(districtCode)  : null;
   if (description !== undefined) court.description = description;
   if (capacity !== undefined) court.capacity = Number(capacity);
   if (openTime !== undefined) court.openTime = openTime;
   if (closeTime !== undefined) court.closeTime = closeTime;
   if (status !== undefined) court.status = status;

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

   // Cascade delete: xóa toàn bộ 238 slots giá của sân
   await cleanupPricing(req.params.id);

   res.json({ message: `Đã xóa sân "${court.name}" và toàn bộ cấu hình giá thành công.` });
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

// @desc    Lấy slots giá của ngày cụ thể + trạng thái booked (Public)
// @route   GET /api/courts/:id/slots?date=YYYY-MM-DD
// @access  Public
export const getCourtSlotsByDate = asyncHandler(async (req, res) => {
   const { id } = req.params;
   const { date } = req.query;

   if (!date) return res.status(400).json({ message: 'Thiếu tham số date (YYYY-MM-DD).' });

   const court = await Court.findById(id);
   if (!court) return res.status(404).json({ message: 'Không tìm thấy sân.' });

   // Tính dayOfWeek từ date (0=CN, 1=T2, ..., 6=T7)
   const dayOfWeek = new Date(date).getDay();

   // Lấy slots giá theo dayOfWeek của sân từ CourtPricing
   let pricingSlots = await CourtPricing.find({
      court: id, dayOfWeek, isActive: true,
   }).sort({ startTime: 1 }).lean();

   // Auto-seed nếu sân chưa có pricing
   if (pricingSlots.length === 0) {
      const { initDefaultPricing: seedPricing } = await import('./pricing.controller.js');
      await seedPricing(id);
      pricingSlots = await CourtPricing.find({
         court: id, dayOfWeek, isActive: true,
      }).sort({ startTime: 1 }).lean();
   }

   // TODO: Nối với Booking để lấy bookedTimes khi module Booking hoàn chỉnh
   // const bookings = await Booking.find({ court: id, date, status: { $in: ['pending', 'confirmed'] } });
   // const bookedTimes = bookings.flatMap(b => b.slots);
   const bookedTimes = [];

   const slots = pricingSlots.map(s => ({
      time: s.startTime,
      endTime: s.endTime,
      price: s.price,
      status: bookedTimes.includes(s.startTime) ? 'booked' : 'available',
   }));

   res.json({ success: true, date, dayOfWeek, slots });
});
