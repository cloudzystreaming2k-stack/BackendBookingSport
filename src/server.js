import 'dotenv/config';

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { initSocket } from './socket.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import courtRoutes from './routes/court.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin.routes.js';
import locationRoutes from './routes/location.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import newsRoutes from './routes/news.routes.js';
import publicNewsRoutes from './routes/news.public.routes.js';
import { publicContactRoutes, adminContactRoutes } from './routes/contact.routes.js';
import { notFound, errorHandler } from './middlewares/error.middleware.js';

const app = express();
const httpServer = createServer(app);

// Khởi tạo Socket.io
initSocket(httpServer);

// --- Middlewares ---
app.use(helmet());
app.use(cors({
   origin: process.env.CLIENT_URL || 'http://localhost:5173',
   credentials: true,
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
app.use('/api/admin/payments', paymentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/news', newsRoutes);
app.use('/api/news', publicNewsRoutes); // Public news API
app.use('/api/contacts', publicContactRoutes);
app.use('/api/admin/contacts', adminContactRoutes);

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
      httpServer.listen(PORT, () => {
         console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
         console.log(`🔌 Socket.io đã sẵn sàng`);
      });
   });
}

export default app;

