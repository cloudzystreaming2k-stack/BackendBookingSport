/**
 * MIGRATION SCRIPT: Chuyển đổi trường `name` sang `firstName` + `lastName`
 * Chạy 1 lần duy nhất bằng lệnh: node src/scripts/migrate_names.js
 * 
 * Logic tách tên: "Nguyễn Minh Tuấn" → lastName="Nguyễn Minh", firstName="Tuấn"
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/datsanthethao';

async function migrate() {
   try {
      await mongoose.connect(MONGO_URI);
      console.log('✅ Kết nối MongoDB thành công.');

      const db = mongoose.connection.db;
      const usersCollection = db.collection('users');

      // Tìm tất cả user còn trường `name` cũ và chưa có firstName
      const usersToMigrate = await usersCollection.find({
         name: { $exists: true, $ne: '' },
         firstName: { $exists: false }
      }).toArray();

      console.log(`📊 Tìm thấy ${usersToMigrate.length} user cần migrate.`);

      if (usersToMigrate.length === 0) {
         console.log('🎉 Không có user nào cần migrate. Thoát.');
         process.exit(0);
      }

      let successCount = 0;
      let errorCount = 0;

      for (const user of usersToMigrate) {
         try {
            const fullName = (user.name || '').trim();
            const nameParts = fullName.split(' ').filter(Boolean);
            const firstName = nameParts.pop() || 'User';   // Lấy phần tử cuối làm Tên
            const lastName  = nameParts.join(' ') || '';    // Phần còn lại là Họ đệm

            await usersCollection.updateOne(
               { _id: user._id },
               {
                  $set:   { firstName, lastName },
                  $unset: { name: '' }                       // Xóa field 'name' cũ
               }
            );

            console.log(`  ✓ ${fullName} → firstName="${firstName}", lastName="${lastName}"`);
            successCount++;
         } catch (err) {
            console.error(`  ✗ Lỗi user ${user._id}: ${err.message}`);
            errorCount++;
         }
      }

      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`✅ Migration hoàn tất!`);
      console.log(`   Thành công: ${successCount} user`);
      console.log(`   Lỗi:       ${errorCount} user`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

   } catch (err) {
      console.error('❌ Lỗi kết nối hoặc migration:', err.message);
      process.exit(1);
   } finally {
      await mongoose.disconnect();
      console.log('🔌 Đã ngắt kết nối MongoDB.');
      process.exit(0);
   }
}

migrate();
