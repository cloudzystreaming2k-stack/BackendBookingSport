import express from 'express';
import {
  createContact,
  getContacts,
  updateContactStatus,
  replyContact,
  deleteContact
} from '../controllers/contact.controller.js';
import { protect, adminOnly } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public Routes (Dành cho trang chủ /contact)
router.post('/', createContact);

// Private Routes (Dành cho Admin Dashboard)
// Lưu ý: Các route này sẽ được prefix là /api/admin/contacts ở server.js
// Tuy nhiên vì ở server.js có thể ta map cả router này vào /api/contacts và /api/admin/contacts
// Để thiết kế rõ ràng, ta chia router ra hoặc xuất khẩu 2 router.
// Tạm thời xuất chung, ở server.js sẽ gọi khác nhau.

export const publicContactRoutes = express.Router();
publicContactRoutes.post('/', createContact);

export const adminContactRoutes = express.Router();
adminContactRoutes.use(protect, adminOnly);
adminContactRoutes.get('/', getContacts);
adminContactRoutes.put('/:id/status', updateContactStatus);
adminContactRoutes.post('/:id/reply', replyContact);
adminContactRoutes.delete('/:id', deleteContact);
