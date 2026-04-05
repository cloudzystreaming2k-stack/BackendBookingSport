import asyncHandler from 'express-async-handler';
import Province from '../models/Province.model.js';
import District from '../models/District.model.js';

// @desc    Lấy toàn bộ danh sách tỉnh/thành phố
// @route   GET /api/locations/provinces
// @access  Public
export const getProvinces = asyncHandler(async (req, res) => {
   const provinces = await Province.find({})
      .select('code name codename')
      .sort({ name: 1 })
      .lean();

   res.json({ success: true, data: provinces });
});

// @desc    Lấy danh sách quận/huyện theo mã tỉnh
// @route   GET /api/locations/provinces/:code/districts
// @access  Public
export const getDistrictsByProvince = asyncHandler(async (req, res) => {
   const { code } = req.params;
   const provinceCode = Number(code);

   if (isNaN(provinceCode)) {
      return res.status(400).json({ message: 'Mã tỉnh không hợp lệ.' });
   }

   const districts = await District.find({ provinceCode })
      .select('code name codename provinceCode')
      .sort({ name: 1 })
      .lean();

   res.json({ success: true, data: districts });
});
