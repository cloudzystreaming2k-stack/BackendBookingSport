import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Vui lòng nhập tiêu đề bài viết'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Vui lòng nhập nội dung bài viết'],
    },
    thumbnail: {
      type: String, // URL từ liên kết ngoài
      default: '',
    },
    summary: {
      type: String,
      default: '',
    },
    slug: {
      type: String,
      unique: true,
    },
    author: {
      type: String,
      default: 'Admin',
      required: [true, 'Tên tác giả là bắt buộc'],
    },
    category: {
      type: String,
      required: [true, 'Vui lòng chọn danh mục'],
      enum: ['news', 'guide', 'health', 'event'],
    },
    status: {
      type: String,
      enum: ['published', 'draft'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

const News = mongoose.model('News', newsSchema);

export default News;
