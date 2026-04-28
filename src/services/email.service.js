import nodemailer from 'nodemailer';

/**
 * Gửi email phản hồi cho người dùng
 * @param {string} toEmail Địa chỉ email người nhận
 * @param {string} userName Tên người nhận
 * @param {string} subject Chủ đề liên hệ ban đầu
 * @param {string} replyContent Nội dung admin phản hồi
 * @returns {Promise} Trả về promise kết quả gửi email
 */
export const sendReplyEmail = async (toEmail, userName, subject, replyContent) => {
  try {
    // 1. Cấu hình transporter (người vận chuyển) kết nối với SMTP server
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
      },
    });

    // 2. Chuẩn bị template HTML với nội dung
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">SportBooking Support</h2>
        </div>
        <div style="padding: 24px; color: #333; line-height: 1.6;">
          <p>Chào <strong>${userName}</strong>,</p>
          <p>Cảm ơn bạn đã liên hệ với SportBooking. Dưới đây là phản hồi cho yêu cầu của bạn về chủ đề: <em>"${subject}"</em></p>
          
          <div style="background-color: #f3f4f6; padding: 16px; border-left: 4px solid #2563eb; margin: 20px 0; border-radius: 4px; white-space: pre-wrap;">
            ${replyContent}
          </div>
          
          <p>Nếu bạn có thêm bất kỳ thắc mắc nào, đừng ngần ngại trả lời lại email này nhé!</p>
          <p>Trân trọng,<br><strong>Đội ngũ SportBooking</strong></p>
        </div>
        <div style="background-color: #f8fafc; padding: 12px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e0e0e0;">
          © 2026 SportBooking. All rights reserved.
        </div>
      </div>
    `;

    // 3. Thiết lập thông tin gói thư
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"SportBooking Support" <noreply@sportbooking.com>',
      to: toEmail,
      subject: `[SportBooking] Phản hồi về: ${subject}`,
      html: htmlTemplate,
    };

    // 4. Thực thi gửi
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Không thể gửi email. Vui lòng kiểm tra lại cấu hình (App Passwords) hoặc kết nối mạng.');
  }
};
