import express from 'express';
import {
  getNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
} from '../controllers/news.controller.js';
import { protect, adminOnly } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Tất cả endpoints đều cần quyền Admin
router.use(protect, adminOnly);

router.route('/')
  .get(getNews)
  .post(createNews);

router.route('/:id')
  .get(getNewsById)
  .put(updateNews)
  .delete(deleteNews);

export default router;
