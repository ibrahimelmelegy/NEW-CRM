import express from 'express';
import territoryController from './territoryController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Territory
 *   description: Territory management and hierarchy
 */

//** --------------------- GET --------------------- */

/**
 * @swagger
 * /api/territories:
 *   get:
 *     summary: Get all territories with optional filters
 *     tags: [Territory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by parent territory ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of territories
 */
router.get('/', authenticateUser, territoryController.getTerritories);

/**
 * @swagger
 * /api/territories/tree:
 *   get:
 *     summary: Get territories as a hierarchical tree
 *     tags: [Territory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hierarchical tree of territories
 */
router.get('/tree', authenticateUser, territoryController.getTerritoryTree);

/**
 * @swagger
 * /api/territories/{id}:
 *   get:
 *     summary: Get a territory by ID
 *     tags: [Territory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Territory ID
 *     responses:
 *       200:
 *         description: Territory details with parent and children
 *       404:
 *         description: Territory not found
 */
router.get('/:id', authenticateUser, territoryController.getTerritoryById);

//** --------------------- POST --------------------- */

/**
 * @swagger
 * /api/territories:
 *   post:
 *     summary: Create a new territory
 *     tags: [Territory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 default: region
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 description: Parent territory ID for nesting
 *               assignedUserId:
 *                 type: integer
 *                 description: User ID to assign to this territory
 *               boundaries:
 *                 type: object
 *                 description: GeoJSON or boundary data
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Territory created successfully
 */
router.post('/', authenticateUser, territoryController.createTerritory);

//** --------------------- PUT --------------------- */

/**
 * @swagger
 * /api/territories/{id}:
 *   put:
 *     summary: Update an existing territory
 *     tags: [Territory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Territory ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *               parentId:
 *                 type: string
 *                 format: uuid
 *               assignedUserId:
 *                 type: integer
 *               boundaries:
 *                 type: object
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Territory updated successfully
 *       404:
 *         description: Territory not found
 */
router.put('/:id', authenticateUser, territoryController.updateTerritory);

//** --------------------- DELETE --------------------- */

/**
 * @swagger
 * /api/territories/{id}:
 *   delete:
 *     summary: Delete a territory
 *     tags: [Territory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Territory ID
 *     responses:
 *       200:
 *         description: Territory deleted successfully
 *       404:
 *         description: Territory not found
 */
router.delete('/:id', authenticateUser, territoryController.deleteTerritory);

export default router;
