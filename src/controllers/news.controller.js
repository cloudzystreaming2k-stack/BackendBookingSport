import mongoose from 'mongoose';
import News from '../models/news.model.js';

// @desc    Lấy danh sách tất cả tin tức (có lọc và phân trang)
// @route   GET /api/admin/news
// @access  Private/Admin
export const getNews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: 'i' };
    }

    const newsList = await News.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await News.countDocuments(filter);

    res.json({
      news: newsList,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tải danh sách tin tức', error: error.message });
  }
};

// @desc    Lấy chi tiết 1 tin tức theo ID
// @route   GET /api/admin/news/:id
// @access  Private/Admin
export const getNewsById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Mã tin tức không hợp lệ' });
    }
    
    const newsItem = await News.findById(req.params.id);
    if (!newsItem) {
      return res.status(404).json({ message: 'Không tìm thấy tin tức' });
    }
    res.json(newsItem);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tải tin tức', error: error.message });
  }
};

// Hàm helper để tạo URL thân thiện (slug) từ title tiếng Việt
const generateSlug = (text) => {
  let slg = text.toString().toLowerCase().trim()
    .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/g, 'a')
    .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/g, 'e')
    .replace(/i|í|ì|ỉ|ĩ|ị/g, 'i')
    .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/g, 'o')
    .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/g, 'u')
    .replace(/ý|ỳ|ỷ|ỹ|ỵ/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes
  return slg + '-' + Date.now().toString().slice(-5);
};

// @desc    Tạo tin tức mới
// @route   POST /api/admin/news
// @access  Private/Admin
export const createNews = async (req, res) => {
  try {
    const { title, summary, content, thumbnail, category, status, author } = req.body;

    const slug = generateSlug(title || 'news');

    const newsItem = await News.create({
      title,
      summary,
      content,
      thumbnail,
      slug,
      category,
      status: status || 'draft',
      author: author ? author.trim() : (req.user?.name || 'Admin'), // Lấy tên truyền vào hoặc mặc định
    });

    res.status(201).json(newsItem);
  } catch (error) {
    res.status(400).json({ message: 'Dữ liệu không hợp lệ', error: error.message });
  }
};

// @desc    Cập nhật tin tức
// @route   PUT /api/admin/news/:id
// @access  Private/Admin
export const updateNews = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Mã tin tức không hợp lệ' });
    }

    const newsItem = await News.findById(req.params.id);
    if (!newsItem) {
      return res.status(404).json({ message: 'Không tìm thấy tin tức' });
    }

    const updatedNews = await News.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(updatedNews);
  } catch (error) {
    res.status(400).json({ message: 'Không thể cập nhật tin tức', error: error.message });
  }
};

// @desc    Xóa tin tức
// @route   DELETE /api/admin/news/:id
// @access  Private/Admin
export const deleteNews = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Mã tin tức không hợp lệ' });
    }

    const newsItem = await News.findById(req.params.id);
    if (!newsItem) {
      return res.status(404).json({ message: 'Không tìm thấy tin tức' });
    }

    await newsItem.deleteOne();
    res.json({ message: 'Đã xóa tin tức thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Không thể xóa tin tức', error: error.message });
  }
};

// @desc    Lấy danh sách tất cả tin tức dạng Public (chỉ lấy 'published')
// @route   GET /api/news
// @access  Public
export const getPublicNews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { status: 'published' };
    
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }
    
    // Không dùng search phức tạp ở public mà nếu có thì filter theo title
    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: 'i' };
    }

    const newsList = await News.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await News.countDocuments(filter);

    res.json({
      news: newsList,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tải trang tin tức', error: error.message });
  }
};

// @desc    Lấy chi tiết 1 tin tức theo Slug
// @route   GET /api/news/:slug
// @access  Public
export const getNewsBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const newsItem = await News.findOne({ slug, status: 'published' });
    if (!newsItem) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết hoặc bài viết đã bị gỡ' });
    }
    res.json(newsItem);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tải chi tiết bài viết', error: error.message });
  }
};
