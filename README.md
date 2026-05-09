# SportBooking Backend API 🏟️

Hệ thống Backend (RESTful API) cho Website Đặt Sân Thể Thao (MERN Stack).

## 🚀 Công Nghệ Sử Dụng (Tech Stack)

<div align="left">
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="NodeJS" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="ExpressJS" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white" alt="Mongoose" />
  <img src="https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101" alt="Socket.io" />
  <br/>
  <img src="https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens" alt="JWT" />
  <img src="https://img.shields.io/badge/Google_OAuth-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google OAuth" />
  <img src="https://img.shields.io/badge/Facebook_OAuth-1877F2?style=for-the-badge&logo=facebook&logoColor=white" alt="Facebook OAuth" />
  <br/>
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=Cloudinary&logoColor=white" alt="Cloudinary" />
  <img src="https://img.shields.io/badge/Nodemailer-14A0F0?style=for-the-badge&logo=maildotru&logoColor=white" alt="Nodemailer" />
  <img src="https://img.shields.io/badge/VNPay_Sandbox-005BAA?style=for-the-badge&logo=moneygram&logoColor=white" alt="VNPay Sandbox" />
  <img src="https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white" alt="Gemini AI" />
</div>

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Sử dụng Mongoose)
- **Real-time:** Socket.io (Thông báo thời gian thực)
- **Lưu trữ ảnh:** Cloudinary + Multer
- **Xác thực:** JWT (JSON Web Token), Google OAuth, Facebook OAuth
- **Thanh toán:** Tích hợp VNPay Sandbox
- **Gửi Email:** Nodemailer
- **AI Chatbot:** Google Generative AI (Gemini 1.5 Flash)

## 📋 Yêu Cầu Cài Đặt (Prerequisites)
Để chạy được dự án này trên máy mới, bạn cần cài đặt:
1. [Node.js](https://nodejs.org/) (Khuyến nghị bản LTS - v18 hoặc v20)
2. [MongoDB](https://www.mongodb.com/try/download/community) (Cài đặt MongoDB Compass ở local hoặc dùng MongoDB Atlas Cloud)
3. Git

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Dự Án (Setup Guide)

### Bước 1: Clone dự án
```bash
git clone <đường_dẫn_git_repository_của_bạn>
cd datsanthethao/backend
```

### Bước 2: Cài đặt thư viện (Dependencies)
Cài đặt tất cả các gói thư viện cần thiết thông qua NPM:
```bash
npm install
```

### Bước 3: Cấu hình biến môi trường (.env)
1. Trong thư mục `backend/`, copy file mẫu `.env.example` và đổi tên thành `.env`
2. Mở file `.env` lên và điền các thông số cần thiết (Xem mục Cấu hình .env bên dưới)

```bash
cp .env.example .env
```

### Bước 4: Chạy dự án
Có 2 chế độ để khởi động server:

**Chế độ phát triển (Development):** Tự động reload server mỗi khi bạn lưu code.
```bash
npm run dev
```

**Chế độ production (Thực tế):**
```bash
npm start
```
*(Server mặc định sẽ chạy ở địa chỉ: `http://localhost:5000`)*

## ⚙️ Cấu Hình File `.env`
Dưới đây là các biến môi trường quan trọng bạn cần thiết lập để hệ thống hoạt động đầy đủ:

| Biến | Ý nghĩa | Gợi ý/Ví dụ |
|------|---------|-------|
| `PORT` | Cổng chạy server | `5000` |
| `MONGO_URI` | Chuỗi kết nối MongoDB | `mongodb://localhost:27017/sportbooking` |
| `CLIENT_URL` | Địa chỉ của Frontend (CORS) | `http://localhost:5173` |
| `ACCESS_TOKEN_SECRET` | Khóa bí mật tạo JWT Access Token | Bất kỳ chuỗi ngẫu nhiên nào |
| `REFRESH_TOKEN_SECRET`| Khóa bí mật tạo JWT Refresh Token| Bất kỳ chuỗi ngẫu nhiên nào |
| `CLOUDINARY_*` | API keys cho lưu trữ ảnh trên Cloudinary | Lấy từ cloudinary.com |
| `VNP_*` | Thông tin tài khoản Sandbox VNPay | Lấy từ vnpayment.vn |
| `EMAIL_*` | Thông tin cấu hình SMTP Gmail | Dùng App Password của Google |
| `GEMINI_API_KEY` | Mã API gọi AI Chatbot | Lấy từ aistudio.google.com |

> 💡 **Mẹo nhỏ:** Bạn không cần phải điền đủ 100% các khóa phụ (Cloudinary, VNPay, Gemini) để server khởi động. Nếu thiếu, một số chức năng tương ứng sẽ báo lỗi khi sử dụng nhưng hệ thống lõi vẫn hoạt động bình thường.

## 🗂️ Cấu Trúc Thư Mục Chính

Dự án được tổ chức theo mô hình **MVC** (Model-View-Controller) mở rộng, giúp code dễ bảo trì và scale:

<details open>
<summary><b>Nhấn để xem/ẩn chi tiết cấu trúc</b></summary>

```text
backend/
├── 📁 src/
│   ├── ⚙️ config/       # Cấu hình kết nối DB, Cloudinary...
│   ├── 🎮 controllers/  # Xử lý logic nghiệp vụ cho từng route (Admin, Booking, Chatbot...)
│   ├── 🛡️ middlewares/  # Các hàm chặn giữa (Xác thực JWT, Bắt lỗi, Upload File)
│   ├── 🗄️ models/       # Định nghĩa lược đồ (Schema) cho MongoDB
│   ├── 🛣️ routes/       # Định nghĩa các Endpoints API
│   ├── 🔌 services/     # Tương tác với dịch vụ ngoài (Gemini, VNPAY, Nodemailer)
│   ├── 🛠️ utils/        # Các hàm tiện ích (Format date, hash...)
│   ├── 🚀 server.js     # File khởi động chính của Express app
│   └── ⚡ socket.js     # Khởi tạo và xử lý sự kiện Socket.io
├── 📦 package.json      # Danh sách các thư viện đã dùng
└── 🔐 .env.example      # File mẫu chứa danh sách các biến môi trường
```
</details>

## 📦 Các Lệnh (Scripts) Khác
- `npm run seed`: Chạy lệnh để nạp dữ liệu mẫu (mock data) tự động vào database phục vụ cho việc test nhanh.
- `npm test`: Chạy Unit Test tự động bằng Jest.
