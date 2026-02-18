import express from 'express';
import kbController from './kbController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes (published articles)
router.get('/public', kbController.getPublishedArticles);
router.get('/public/categories', kbController.getCategories);
router.get('/public/:slug', kbController.getArticleBySlug);
router.post('/public/:id/helpful', kbController.markHelpful);

// Admin routes (require auth)
router.get('/', authenticateUser, kbController.getArticles);
router.post('/', authenticateUser, kbController.createArticle);
router.get('/:id', authenticateUser, kbController.getArticleById);
router.put('/:id', authenticateUser, kbController.updateArticle);
router.delete('/:id', authenticateUser, kbController.deleteArticle);

export default router;
