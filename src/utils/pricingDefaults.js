// Giá mặc định khi khởi tạo sân mới (100k/slot)
const BASE_PRICE = 100000;

// Danh sách mốc giờ (35 mốc tạo ra 34 slots, mỗi slot 30 phút, 06:00 → 23:00)
const TIMES = [
   '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
   '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
   '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
   '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
   '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
   '21:00', '21:30', '22:00', '22:30', '23:00', // ← 23:00 là endTime của slot 22:30-23:00
];

// 34 slot template (startTime = TIMES[i], endTime = TIMES[i+1])
export const DEFAULT_TIME_SLOTS = TIMES.slice(0, -1).map((startTime, i) => ({
   startTime,
   endTime: TIMES[i + 1],
   price: BASE_PRICE,
}));

/**
 * Tạo 238 CourtPricing docs (34 slot × 7 ngày) cho 1 sân mới
 * dayOfWeek: 0 = CN, 1 = T2, ..., 6 = T7
 */
export function buildDefaultPricingDocs(courtId) {
   const docs = [];
   for (let day = 0; day <= 6; day++) {
      DEFAULT_TIME_SLOTS.forEach(slot => {
         docs.push({ court: courtId, dayOfWeek: day, ...slot });
      });
   }
   return docs; // 238 objects
}
