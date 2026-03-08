import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import courtRoutes from './routes/court.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { notFound, errorHandler } from './middlewares/error.middleware.js';

const app = express();

// --- Middlewares ---
app.use(helmet());
app.use(cors({
   origin: process.env.CLIENT_URL || 'http://localhost:5173',
   credentials: true, // Cho phép gửi Cookie
}));
app.use(express.json());
app.use(cookieParser());
if (process.env.NODE_ENV === 'development') {
   app.use(morgan('dev'));
}

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/courts', courtRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// --- Health Check ---
app.get('/api/health', (req, res) => {
   res.json({ status: 'OK', message: 'Server đang chạy bình thường 🚀' });
});

// --- Error Handlers ---
app.use(notFound);
app.use(errorHandler);

// --- Start Server ---
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
   connectDB().then(() => {
      app.listen(PORT, () => {
         console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
      });
   });
}

export default app;
