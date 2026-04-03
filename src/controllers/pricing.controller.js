import asyncHandler from 'express-async-handler';
import CourtPricing from '../models/CourtPricing.model.js';
import Court from '../models/Court.model.js';
import { buildDefaultPricingDocs } from '../utils/pricingDefaults.js';

// ─── INTERNAL HELPER ──────────────────────────────────────────────────────────

/**
 * Tính min price từng buổi rồi cập nhật lại Court.pricing (display cache)
 * Được gọi sau mỗi lần save/bulk-update slots
 */
async function syncCourtDisplayPrice(courtId) {
   const allSlots = await CourtPricing.find({
      court: courtId,
      isActive: true
   }).lean();

   const priceOf = (from, to) => {
      const filtered = allSlots.filter(
         s => s.startTime >= from && s.startTime < to
      );
      return filtered.length > 0
         ? Math.min(...filtered.map(s => s.price))
         : 0;
   };

   const morning   = priceOf('06:00', '12:00');
   const afternoon = priceOf('12:00', '18:00');
   const evening   = priceOf('18:00', '23:00');

   await Court.updateOne(
      { _id: courtId },
      { $set: {
         'pricing.morning':   morning,
         'pricing.afternoon': afternoon,
         'pricing.evening':   evening,
      }}
   );
}

// ─── EXPORTED HELPERS ─────────────────────────────────────────────────────────

/**
 * Seed 238 slots mặc định (100k/slot) khi tạo sân mới
 * Gọi từ court.controller.js sau Court.create()
 */
export async function initDefaultPricing(courtId) {
   const docs = buildDefaultPricingDocs(courtId);
   await CourtPricing.insertMany(docs, { ordered: false });
   await syncCourtDisplayPrice(courtId);
}

/**
 * Xóa toàn bộ 238 slots khi xóa sân (cascade delete)
 * Gọi từ court.controller.js sau Court.findByIdAndDelete()
 */
export async function cleanupPricing(courtId) {
   await CourtPricing.deleteMany({ court: courtId });
}

// ─── API HANDLERS ─────────────────────────────────────────────────────────────

// @desc    Lấy toàn bộ slots giá của 1 sân, group theo dayOfWeek
// @route   GET /api/admin/courts/:id/pricing
// @access  Admin
export const getPricingByCourt = asyncHandler(async (req, res) => {
   const { id } = req.params;

   const court = await Court.findById(id);
   if (!court) return res.status(404).json({ message: 'Không tìm thấy sân.' });

   let slots = await CourtPricing.find({ court: id, isActive: true })
      .sort({ dayOfWeek: 1, startTime: 1 })
      .lean();

   // Auto-seed cho sân cũ chưa có CourtPricing (tạo trước khi có tính năng này)
   if (slots.length === 0) {
      await initDefaultPricing(id);
      slots = await CourtPricing.find({ court: id, isActive: true })
         .sort({ dayOfWeek: 1, startTime: 1 })
         .lean();
   }

   // Group theo dayOfWeek (0–6) để Frontend dễ render
   const grouped = Array.from({ length: 7 }, (_, day) => ({
      dayOfWeek: day,
      timeSlots: slots.filter(s => s.dayOfWeek === day).map(s => ({
         startTime: s.startTime,
         endTime:   s.endTime,
         price:     s.price,
      })),
   }));

   res.json({ success: true, data: grouped });
});

// @desc    Lưu hàng loạt slots (upsert 238 slots) + sync Court.pricing
// @route   POST /api/admin/courts/:id/pricing/batch
// @access  Admin
export const savePricingBatch = asyncHandler(async (req, res) => {
   const { id } = req.params;
   const { slots } = req.body;

   if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ message: 'Dữ liệu slots không hợp lệ.' });
   }

   const court = await Court.findById(id);
   if (!court) return res.status(404).json({ message: 'Không tìm thấy sân.' });

   // Upsert toàn bộ bằng bulkWrite (hiệu năng cao, không lỗi khi trùng)
   const operations = slots.map(slot => ({
      updateOne: {
         filter: { court: id, dayOfWeek: slot.dayOfWeek, startTime: slot.startTime },
         update: { $set: {
            endTime:  slot.endTime,
            price:    Number(slot.price),
            isActive: true,
         }},
         upsert: true,
      }
   }));

   const result = await CourtPricing.bulkWrite(operations, { ordered: false });

   // Auto-sync Court.pricing (morning/afternoon/evening = min của từng block)
   await syncCourtDisplayPrice(id);

   res.json({
      success: true,
      message: `Đã lưu ${slots.length} slots thành công.`,
      upserted: result.upsertedCount,
      modified: result.modifiedCount,
   });
});

// @desc    Cập nhật giá hàng loạt theo range ngày + khung giờ
// @route   POST /api/admin/courts/:id/pricing/bulk
// @access  Admin
export const applyBulkPricing = asyncHandler(async (req, res) => {
   const { id } = req.params;
   const { days, fromTime, toTime, price } = req.body;

   // Validate
   if (!Array.isArray(days) || days.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn ít nhất 1 ngày.' });
   }
   if (!fromTime || !toTime || fromTime >= toTime) {
      return res.status(400).json({ message: 'Khoảng giờ không hợp lệ.' });
   }
   if (!price || Number(price) < 0) {
      return res.status(400).json({ message: 'Giá không hợp lệ.' });
   }

   const court = await Court.findById(id);
   if (!court) return res.status(404).json({ message: 'Không tìm thấy sân.' });

   const result = await CourtPricing.updateMany(
      {
         court: id,
         dayOfWeek: { $in: days.map(Number) },
         startTime: { $gte: fromTime, $lt: toTime },
         isActive: true,
      },
      { $set: { price: Number(price) } }
   );

   // Auto-sync Court.pricing
   await syncCourtDisplayPrice(id);

   res.json({
      success: true,
      message: `Đã cập nhật giá cho ${result.modifiedCount} slots.`,
      updated: result.modifiedCount,
   });
});
