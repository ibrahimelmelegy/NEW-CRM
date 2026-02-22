import express from 'express';
import commentController from './commentController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Comment
 *   description: Comments on various entities (leads, deals, etc.)
 */

/**
 * @swagger
 * /api/comments:
 *   get:
 *     summary: Get comments for an entity
 *     tags: [Comment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *         description: Type of entity (e.g. lead, deal, contact)
 *       - in: query
 *         name: entityId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the entity
 *     responses:
 *       200:
 *         description: List of comments
 */
router.get('/', authenticateUser, commentController.getComments);

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Create a new comment
 *     tags: [Comment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entityType
 *               - entityId
 *               - content
 *             properties:
 *               entityType:
 *                 type: string
 *                 description: Type of entity (e.g. lead, deal, contact)
 *               entityId:
 *                 type: integer
 *                 description: ID of the entity
 *               content:
 *                 type: string
 *                 description: Comment text
 *               parentId:
 *                 type: integer
 *                 description: Parent comment ID for replies
 *     responses:
 *       201:
 *         description: Comment created
 */
router.post('/', authenticateUser, commentController.createComment);

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Updated comment text
 *     responses:
 *       200:
 *         description: Comment updated
 */
router.put('/:id', authenticateUser, commentController.updateComment);

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted
 */
router.delete('/:id', authenticateUser, commentController.deleteComment);

export default router;
