import express from 'express';
import searchController from './searchController';
import { authenticateUser } from '../middleware/authMiddleware';
import { searchLimiter } from '../infrastructure/rateLimitEnhanced';

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Global and entity-specific search with search history
 */

const router = express.Router();
router.use(searchLimiter);

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Global search
 *     description: Search across leads, deals, clients, contacts, opportunities or a single entity
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *         description: Single entity type to search (e.g. lead, deal, client)
 *       - in: query
 *         name: entityTypes
 *         schema:
 *           type: string
 *         description: Comma-separated entity types for global search (e.g. lead,deal)
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
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/', authenticateUser, searchController.search);

/**
 * @swagger
 * /api/search/recent:
 *   get:
 *     summary: Get recent searches
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent search queries for the current user
 */
router.get('/recent', authenticateUser, searchController.getRecentSearches);

/**
 * @swagger
 * /api/search/recent:
 *   delete:
 *     summary: Clear recent searches
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Search history cleared
 */
router.delete('/recent', authenticateUser, searchController.clearRecentSearches);

export default router;
