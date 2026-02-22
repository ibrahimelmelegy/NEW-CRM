import express from 'express';
import savedViewController from './savedViewController';
import { authenticateUser } from '../middleware/authMiddleware';

/**
 * @swagger
 * tags:
 *   name: Saved View
 *   description: Saved views — custom filtered views for CRM entities
 */

const router = express.Router();

// Static and specific routes MUST come before parameterized routes

/**
 * @swagger
 * /api/saved-views/view/{id}:
 *   get:
 *     summary: Get saved view by ID
 *     tags: [Saved View]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Saved view details
 *       404:
 *         description: View not found
 *       500:
 *         description: Server error
 */
router.get('/view/:id', authenticateUser, savedViewController.getViewById);

/**
 * @swagger
 * /api/saved-views:
 *   post:
 *     summary: Create a saved view
 *     tags: [Saved View]
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
 *               - entityType
 *             properties:
 *               name:
 *                 type: string
 *               entityType:
 *                 type: string
 *                 description: Entity type (e.g. lead, deal, contact)
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
 *               sortBy:
 *                 type: string
 *               sortOrder:
 *                 type: string
 *                 enum: [ASC, DESC]
 *               columns:
 *                 type: array
 *                 items:
 *                   type: string
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *               isShared:
 *                 type: boolean
 *                 default: false
 *               color:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       201:
 *         description: View created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', authenticateUser, savedViewController.createView);

/**
 * @swagger
 * /api/saved-views/{id}:
 *   put:
 *     summary: Update a saved view
 *     tags: [Saved View]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               filters:
 *                 type: array
 *                 items:
 *                   type: object
 *               sortBy:
 *                 type: string
 *               sortOrder:
 *                 type: string
 *                 enum: [ASC, DESC]
 *               columns:
 *                 type: array
 *                 items:
 *                   type: string
 *               isDefault:
 *                 type: boolean
 *               isShared:
 *                 type: boolean
 *               color:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       200:
 *         description: View updated
 *       404:
 *         description: View not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticateUser, savedViewController.updateView);

/**
 * @swagger
 * /api/saved-views/{id}:
 *   delete:
 *     summary: Delete a saved view
 *     tags: [Saved View]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: View deleted
 *       404:
 *         description: View not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateUser, savedViewController.deleteView);

/**
 * @swagger
 * /api/saved-views/{id}/default:
 *   patch:
 *     summary: Set a view as default
 *     description: Sets the specified view as the default for its entity type
 *     tags: [Saved View]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: View set as default
 *       404:
 *         description: View not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/default', authenticateUser, savedViewController.setDefault);

/**
 * @swagger
 * /api/saved-views/{entityType}:
 *   get:
 *     summary: List saved views for entity type
 *     description: Returns all saved views for the given entity type (own + shared)
 *     tags: [Saved View]
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
 *         description: List of saved views
 *       500:
 *         description: Server error
 */
router.get('/:entityType', authenticateUser, savedViewController.getViews);

export default router;
