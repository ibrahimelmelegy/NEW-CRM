import express from 'express';
import kbController from './kbController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Knowledge Base
 *   description: Knowledge base articles and categories
 */

// Public routes (published articles)

/**
 * @swagger
 * /api/knowledge-base/public:
 *   get:
 *     summary: Get published articles (public)
 *     tags: [Knowledge Base]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated published articles
 */
router.get('/public', kbController.getPublishedArticles);

/**
 * @swagger
 * /api/knowledge-base/public/categories:
 *   get:
 *     summary: Get all article categories (public)
 *     tags: [Knowledge Base]
 *     responses:
 *       200:
 *         description: List of category names
 */
router.get('/public/categories', kbController.getCategories);

/**
 * @swagger
 * /api/knowledge-base/public/{slug}:
 *   get:
 *     summary: Get a published article by slug (public)
 *     tags: [Knowledge Base]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Article details
 */
router.get('/public/:slug', kbController.getArticleBySlug);

/**
 * @swagger
 * /api/knowledge-base/public/{id}/helpful:
 *   post:
 *     summary: Mark an article as helpful (public)
 *     tags: [Knowledge Base]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Helpful count incremented
 */
router.post('/public/:id/helpful', kbController.markHelpful);

// Admin routes (require auth)

/**
 * @swagger
 * /api/knowledge-base:
 *   get:
 *     summary: Get all articles (admin)
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, ARCHIVED]
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated articles
 */
router.get('/', authenticateUser, kbController.getArticles);

/**
 * @swagger
 * /api/knowledge-base:
 *   post:
 *     summary: Create a new article
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PUBLISHED, ARCHIVED]
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Article created
 */
router.post('/', authenticateUser, kbController.createArticle);

/**
 * @swagger
 * /api/knowledge-base/{id}:
 *   get:
 *     summary: Get an article by ID (admin)
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Article details
 */
router.get('/:id', authenticateUser, kbController.getArticleById);

/**
 * @swagger
 * /api/knowledge-base/{id}:
 *   put:
 *     summary: Update an article
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PUBLISHED, ARCHIVED]
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Article updated
 */
router.put('/:id', authenticateUser, kbController.updateArticle);

/**
 * @swagger
 * /api/knowledge-base/{id}:
 *   delete:
 *     summary: Delete an article
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Article deleted
 */
router.delete('/:id', authenticateUser, kbController.deleteArticle);

export default router;
