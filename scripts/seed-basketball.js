import 'dotenv/config'; // Mst be first in ESM

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Court from '../src/models/Court.model.js';
import CourtType from '../src/models/CourtType.model.js';
import cloudinary from '../src/config/cloudinary.config.js';

// Các đường dẫn ảnh do AI vừa tạo
const localImages = [
    'C:/Users/p51/.gemini/antigravity/brain/0a90139b-2279-4786-b993-24e2bf7bffa4/basketball_indoor_1_1775408755485.png',
    'C:/Users/p51/.gemini/antigravity/brain/0a90139b-2279-4786-b993-24e2bf7bffa4/basketball_outdoor_sunset_1775408774945.png',
    'C:/Users/p51/.gemini/antigravity/brain/0a90139b-2279-4786-b993-24e2bf7bffa4/basketball_premium_arena_1775408792690.png'
];

async function seedBasketballCourts() {
    try {
        console.log('Connecting to MongoDB...', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected!');

        // 1. Upload ảnh lên Cloudinary
        console.log('Đang upload 3 ảnh AI lên Cloudinary...');
        const uploadedUrls = [];
        for (const imgPath of localImages) {
            console.log(`Uploading: ${imgPath}`);
            const result = await cloudinary.uploader.upload(imgPath, {
                folder: 'datsanthethao/courts',
                transformation: [{ width: 1920, height: 1080, crop: 'fill', gravity: 'auto', quality: 'auto:best', fetch_format: 'auto' }]
            });
            uploadedUrls.push(result.secure_url);
        }
        console.log('Upload thành công!');
        console.log(uploadedUrls);

        // 2. Tìm hoặc Tạo CourtType bóng rổ
        let basketballType = await CourtType.findOne({ name: 'Bóng rổ' });
        if (!basketballType) {
            basketballType = await CourtType.create({
                name: 'Bóng rổ',
                icon: 'Basketball', // assuming Lucide icon
                color: '#f97316',   // orange-500
                description: 'Sân bóng rổ tiêu chuẩn'
            });
            console.log('Đã tạo loại sân Bóng rổ.');
        } else {
            console.log('Loại sân Bóng rổ đã tồn tại.');
        }

        // 3. Chuẩn bị dữ liệu 5 sân bóng rổ
        const sampleCourts = [
            {
                name: "Sân Bóng Rổ Pro Basketball Arena",
                code: "BR-9001",
                typeId: basketballType._id,
                address: "Số 8, Đường Phạm Hùng, Mỹ Đình, Nam Từ Liêm, Hà Nội",
                description: "<h3>Sân trong nhà siêu đẹp</h3><p>Sân thi đấu chuyên nghiệp, mặt sàn gỗ xịn xò, dàn đèn 1000W sáng rực ban đêm.</p>",
                pricePerHour: 400000,
                capacity: 10,
                openTime: "05:00",
                closeTime: "23:00",
                images: [uploadedUrls[0], uploadedUrls[2]],
                mainImage: uploadedUrls[0],
                latitude: 21.028511,
                longitude: 105.804817,
                status: "active",
                rating: 4.9,
                reviewCount: 124,
                pricing: { morning: 200000, afternoon: 350000, evening: 400000 }
            },
            {
                name: "Streetball Court Hoàng Cầu",
                code: "BR-9002",
                typeId: basketballType._id,
                address: "Số 1, Phố Hoàng Cầu, Đống Đa, Hà Nội",
                description: "<p>Sân bóng rổ đường phố nổi tiếng nhất Hà Nội, view hồ đỉnh chóp chiều tối ngắm hoàng hôn chill chill.</p>",
                pricePerHour: 250000,
                capacity: 10,
                openTime: "06:00",
                closeTime: "22:00",
                images: [uploadedUrls[1]],
                mainImage: uploadedUrls[1],
                latitude: 21.028511,
                longitude: 105.804817,
                status: "active",
                rating: 4.7,
                reviewCount: 382,
                pricing: { morning: 150000, afternoon: 200000, evening: 250000 }
            },
            {
                name: "Tổ Hợp Thể Thao Cầu Giấy (Bóng rổ)",
                code: "BR-9003",
                typeId: basketballType._id,
                address: "Khu tập thể Dịch Vọng, Cầu Giấy, Hà Nội",
                description: "Sân trong nhà mát mẻ, phù hợp chơi 3x3 và thuê tổ chức giải đấu nội bộ sinh viên.",
                pricePerHour: 300000,
                capacity: 10,
                openTime: "07:00",
                closeTime: "21:00",
                images: [uploadedUrls[2], uploadedUrls[0]],
                mainImage: uploadedUrls[2],
                latitude: 21.028511,
                longitude: 105.804817,
                status: "active",
                rating: 4.5,
                reviewCount: 95,
                pricing: { morning: 200000, afternoon: 250000, evening: 300000 }
            },
            {
                name: "Bóng rổ Sunset Park Hồ Tây",
                code: "BR-9004",
                typeId: basketballType._id,
                address: "Đường Trích Sài, Tây Hồ, Hà Nội",
                description: "Sân ngoài trời gần bờ hồ. Lên kèo pick-up game đông đui nhộn nhịp nhất cộng đồng streetball.",
                pricePerHour: 150000,
                capacity: 10,
                openTime: "05:30",
                closeTime: "23:00",
                images: [uploadedUrls[1], uploadedUrls[2]],
                mainImage: uploadedUrls[1],
                latitude: 21.028511,
                longitude: 105.804817,
                status: "active",
                rating: 4.8,
                reviewCount: 220,
                pricing: { morning: 100000, afternoon: 100000, evening: 150000 }
            },
            {
                name: "VIP Indoor Basketball Club",
                code: "BR-9005",
                typeId: basketballType._id,
                address: "Tầng 5, Vincom Center, Hai Bà Trưng, Hà Nội",
                description: "Trải nghiệm bóng rổ thượng lưu trong nhà, có điều hòa, phòng tắm sấy khô cao cấp.",
                pricePerHour: 800000,
                capacity: 10,
                openTime: "08:00",
                closeTime: "23:00",
                images: [uploadedUrls[2], uploadedUrls[0], uploadedUrls[1]],
                mainImage: uploadedUrls[2],
                latitude: 21.028511,
                longitude: 105.804817,
                status: "active",
                latitude: 21.028511,
                longitude: 105.804817,
                rating: 5.0,
                reviewCount: 42,
                pricing: { morning: 500000, afternoon: 600000, evening: 800000 }
            }
        ];

        await Court.insertMany(sampleCourts);
        console.log(`Đã thêm thành công ${sampleCourts.length} sân bóng rổ!`);

        process.exit(0);
    } catch (error) {
        console.error('Lỗi khi seed data:', error);
        process.exit(1);
    }
}

seedBasketballCourts();
