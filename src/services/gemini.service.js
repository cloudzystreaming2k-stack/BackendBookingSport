import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `Bạn là trợ lý AI của website đặt sân thể thao SportBooking.
Nhiệm vụ của bạn:
- Hướng dẫn người dùng cách đặt sân thể thao trên website.
- Giải thích các phương thức thanh toán (VNPay, MoMo, chuyển khoản...).
- Trả lời các câu hỏi về sân bãi, lịch đặt sân, hủy đặt sân.
- Hỗ trợ người dùng gặp sự cố khi đăng ký, đăng nhập.

Nguyên tắc:
- Luôn trả lời bằng tiếng Việt, thân thiện và lịch sự.
- Câu trả lời ngắn gọn, rõ ràng, dễ hiểu (tối đa 3-4 câu nếu câu hỏi không phức tạp).
- Không bịa đặt thông tin. Nếu không biết, hãy đề nghị người dùng liên hệ hỗ trợ qua trang Liên hệ.
- Không trả lời các chủ đề ngoài phạm vi hỗ trợ website đặt sân thể thao.`;

/**
 * Gửi tin nhắn đến Gemini và nhận phản hồi
 * @param {string} userMessage - Tin nhắn từ người dùng
 * @returns {Promise<string>} - Nội dung phản hồi từ AI
 */
export const generateChatReply = async (userMessage) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: SYSTEM_PROMPT }],
      },
      {
        role: 'model',
        parts: [{ text: 'Xin chào! Tôi là trợ lý AI của SportBooking. Tôi có thể giúp gì cho bạn hôm nay?' }],
      },
    ],
  });

  const result = await chat.sendMessage(userMessage);
  return result.response.text();
};
