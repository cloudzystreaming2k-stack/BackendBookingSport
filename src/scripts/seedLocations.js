/**
 * seedLocations.js
 * Chạy 1 lần duy nhất để cào 63 tỉnh + 700+ huyện từ API công khai vào MongoDB.
 *
 * Usage:
 *   node src/scripts/seedLocations.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import Province from '../models/Province.model.js';
import District from '../models/District.model.js';
import { connectDB } from '../config/db.js';

const API_URL = 'https://provinces.open-api.vn/api/?depth=2';

async function seed() {
   await connectDB();

   console.log('🌏 Đang tải dữ liệu từ provinces.open-api.vn...');
   const response = await fetch(API_URL);
   if (!response.ok) throw new Error(`API lỗi: ${response.status}`);
   const provinces = await response.json();

   // Xóa dữ liệu cũ để seed lại sạch
   await Province.deleteMany({});
   await District.deleteMany({});
   console.log('🗑️  Đã xóa dữ liệu tỉnh/huyện cũ.');

   // Chuẩn bị data
   const provinceDocs = [];
   const districtDocs = [];

   for (const p of provinces) {
      provinceDocs.push({
         code: p.code,
         name: p.name,
         codename: p.codename,
      });

      if (Array.isArray(p.districts)) {
         for (const d of p.districts) {
            districtDocs.push({
               code: d.code,
               name: d.name,
               codename: d.codename,
               provinceCode: p.code,
            });
         }
      }
   }

   // Insert
   await Province.insertMany(provinceDocs, { ordered: false });
   await District.insertMany(districtDocs, { ordered: false });

   console.log(`✅ Đã seed ${provinceDocs.length} tỉnh/thành phố.`);
   console.log(`✅ Đã seed ${districtDocs.length} quận/huyện.`);

   await mongoose.disconnect();
   console.log('🔌 Đã ngắt kết nối DB.');
   process.exit(0);
}

seed().catch(err => {
   console.error('❌ Seed thất bại:', err.message);
   process.exit(1);
});
