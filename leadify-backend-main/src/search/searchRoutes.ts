import express from 'express';
import searchController from './searchController';
import { authenticateUser } from '../middleware/authMiddleware';

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Global and advanced search across CRM entities
 */

const router = express.Router();

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Global search
 *     description: Search across multiple entity types with a single query
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: entityTypes
 *         schema:
 *           type: string
 *         description: Comma-separated entity types to search (e.g. lead,deal,contact)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Search results grouped by entity type
 *       500:
 *         description: Server error
 */
router.get('/', authenticateUser, searchController.search);

/**
 * @swagger
 * /api/search/advanced/{entityType}:
 *   post:
 *     summary: Advanced search
 *     description: Perform advanced search with complex filters on a specific entity type
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *         description: Entity type to search (e.g. lead, deal, contact)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filters:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     field:
 *                       type: string
 *                     operator:
 *                       type: string
 *                     value:
 *                       type: string
 *                 description: Array of filter conditions
 *               conditionLogic:
 *                 type: string
 *                 enum: [AND, OR]
 *                 default: AND
 *               sortBy:
 *                 type: string
 *               sort:
 *                 type: string
 *                 enum: [ASC, DESC]
 *                 default: DESC
 *               page:
 *                 type: integer
 *                 default: 1
 *               limit:
 *                 type: integer
 *                 default: 20
 *     responses:
 *       200:
 *         description: Advanced search results
 *       500:
 *         description: Server error
 */
router.post('/advanced/:entityType', authenticateUser, searchController.advancedSearch);

/**
 * @swagger
 * /api/search/fields/{entityType}:
 *   get:
 *     summary: Get searchable fields
 *     description: Returns the list of searchable fields for a given entity type
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *         description: Entity type (e.g. lead, deal, contact)
 *     responses:
 *       200:
 *         description: List of searchable fields with their types
 *       500:
 *         description: Server error
 */
router.get('/fields/:entityType', authenticateUser, searchController.getSearchableFields);

export default router;
