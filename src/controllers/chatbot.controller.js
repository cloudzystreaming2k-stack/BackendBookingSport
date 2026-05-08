import asyncHandler from 'express-async-handler';
import { generateChatReply } from '../services/gemini.service.js';

const MAX_MESSAGE_LENGTH = 500;

// @desc    Nhận tin nhắn từ người dùng và trả lời bằng Gemini AI
// @route   POST /api/chatbot/message
// @access  Public
export const sendChatMessage = asyncHandler(async (req, res) => {
  let { message } = req.body;

  // Validation
  if (!message || !message.trim()) {
    res.status(400);
    throw new Error('Tin nhắn không được để trống');
  }

  message = message.trim();

  if (message.length > MAX_MESSAGE_LENGTH) {
    res.status(400);
    throw new Error(`Tin nhắn quá dài. Vui lòng giới hạn trong ${MAX_MESSAGE_LENGTH} ký tự`);
  }

  // Gọi Gemini Service
  const reply = await generateChatReply(message);

  res.json({
    success: true,
    reply,
  });
});
