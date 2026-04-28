import asyncHandler from 'express-async-handler';
import Contact from '../models/contact.model.js';
import { sendReplyEmail } from '../services/email.service.js';

// @desc    Tạo liên hệ mới từ public form
// @route   POST /api/contacts
// @access  Public
export const createContact = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    res.status(400);
    throw new Error('Vui lòng điền đầy đủ các thông tin bắt buộc');
  }

  const contact = await Contact.create({
    name,
    email,
    subject,
    message,
  });

  if (contact) {
    res.status(201).json({
      message: 'Gửi liên hệ thành công',
      contact: {
        _id: contact._id,
        name: contact.name,
        email: contact.email,
        status: contact.status,
      },
    });
  } else {
    res.status(400);
    throw new Error('Không thể tạo liên hệ do lỗi dữ liệu');
  }
});

// @desc    Lấy danh sách liên hệ (Có phân trang và lọc)
// @route   GET /api/admin/contacts
// @access  Private/Admin
export const getContacts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Xây dựng bộ lọc
  const filter = {};
  
  if (req.query.status && req.query.status !== 'all') {
    filter.status = req.query.status;
  }
  
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { subject: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const contacts = await Contact.find(filter)
    .sort({ createdAt: -1 }) // Mới nhất lên đầu
    .skip(skip)
    .limit(limit);

  const total = await Contact.countDocuments(filter);

  // Thống kê nhanh để hiển thị trên thẻ Dashboard
  const stats = {
    total: await Contact.countDocuments(),
    new: await Contact.countDocuments({ status: 'new' }),
    read: await Contact.countDocuments({ status: 'read' }),
    replied: await Contact.countDocuments({ status: 'replied' }),
  };

  res.json({
    contacts,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    stats,
  });
});

// @desc    Cập nhật trạng thái liên hệ
// @route   PUT /api/admin/contacts/:id/status
// @access  Private/Admin
export const updateContactStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  const validStatuses = ['new', 'read', 'replied'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Trạng thái không hợp lệ');
  }

  const contact = await Contact.findById(req.params.id);

  if (!contact) {
    res.status(404);
    throw new Error('Không tìm thấy liên hệ');
  }

  contact.status = status;
  await contact.save();

  res.json({ message: 'Cập nhật trạng thái thành công', contact });
});

// @desc    Gửi email phản hồi cho khách
// @route   POST /api/admin/contacts/:id/reply
// @access  Private/Admin
export const replyContact = asyncHandler(async (req, res) => {
  const { replyMessage } = req.body;

  if (!replyMessage) {
    res.status(400);
    throw new Error('Vui lòng nhập nội dung phản hồi');
  }

  const contact = await Contact.findById(req.params.id);

  if (!contact) {
    res.status(404);
    throw new Error('Không tìm thấy liên hệ');
  }

  // 1. Gọi Email Service để gửi đi
  await sendReplyEmail(contact.email, contact.name, contact.subject, replyMessage);

  // 2. Thành công thì lưu lại vào Database
  contact.replyMessage = replyMessage;
  contact.status = 'replied'; // Đổi trạng thái tự động thành Đã phản hồi
  
  await contact.save();

  res.json({
    message: 'Đã gửi email phản hồi thành công',
    contact
  });
});

// @desc    Xóa một liên hệ
// @route   DELETE /api/admin/contacts/:id
// @access  Private/Admin
export const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id);

  if (!contact) {
    res.status(404);
    throw new Error('Không tìm thấy liên hệ');
  }

  await contact.deleteOne();
  res.json({ message: 'Đã xóa liên hệ thành công' });
});
