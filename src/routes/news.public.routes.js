import express from 'express';
import { getPublicNews, getNewsBySlug } from '../controllers/news.controller.js';

const router = express.Router();

router.get('/', getPublicNews);
router.get('/:slug', getNewsBySlug);

export default router;
