import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập họ tên'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Vui lòng nhập email'],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Vui lòng nhập email hợp lệ',
      ],
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: [true, 'Vui lòng chọn hoặc nhập chủ đề'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Vui lòng nhập nội dung lời nhắn'],
    },
    status: {
      type: String,
      enum: ['new', 'read', 'replied'],
      default: 'new',
    },
    replyMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;
