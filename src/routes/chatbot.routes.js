import express from 'express';
import { sendChatMessage } from '../controllers/chatbot.controller.js';

const router = express.Router();

// POST /api/chatbot/message - Public, không cần đăng nhập
router.post('/message', sendChatMessage);

export default router;
