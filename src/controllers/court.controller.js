import Court from '../models/Court.model.js';
import asyncHandler from 'express-async-handler';

// @desc    Lấy danh sách sân (có filter)
// @route   GET /api/courts
// @access  Public
export const getCourts = asyncHandler(async (req, res) => {
   const { type, district, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

   const filter = { isActive: true };
   if (type) filter.typeId = type;
   if (district) filter.district = district;
   if (minPrice || maxPrice) {
      filter.pricePerHour = {};
      if (minPrice) filter.pricePerHour.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerHour.$lte = Number(maxPrice);
   }

   const total = await Court.countDocuments(filter);
   const courts = await Court.find(filter)
      .populate('typeId', 'name')
      .sort({ rating: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

   res.json({ courts, total, page: Number(page), totalPages: Math.ceil(total / limit) });
});

// @desc    Lấy chi tiết 1 sân
// @route   GET /api/courts/:id
// @access  Public
export const getCourtById = asyncHandler(async (req, res) => {
   const court = await Court.findById(req.params.id).populate('typeId', 'name description');
   if (!court) return res.status(404).json({ message: 'Không tìm thấy sân.' });
   res.json(court);
});
