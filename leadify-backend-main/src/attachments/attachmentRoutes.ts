import express from 'express';
import attachmentController from './attachmentController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Attachment
 *   description: File attachments on various entities
 */

/**
 * @swagger
 * /api/attachments:
 *   get:
 *     summary: Get attachments for an entity
 *     tags: [Attachment]
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
 *         description: List of attachments
 */
router.get('/', authenticateUser, attachmentController.getAttachments);

/**
 * @swagger
 * /api/attachments:
 *   post:
 *     summary: Create a new attachment
 *     tags: [Attachment]
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
 *             properties:
 *               entityType:
 *                 type: string
 *                 description: Type of entity (e.g. lead, deal, contact)
 *               entityId:
 *                 type: integer
 *                 description: ID of the entity
 *               fileUrl:
 *                 type: string
 *                 description: URL of the uploaded file
 *               fileName:
 *                 type: string
 *                 description: Original file name
 *               fileSize:
 *                 type: number
 *                 description: File size in bytes
 *               mimeType:
 *                 type: string
 *                 description: MIME type of the file
 *     responses:
 *       201:
 *         description: Attachment created
 */
router.post('/', authenticateUser, attachmentController.createAttachment);

/**
 * @swagger
 * /api/attachments/{id}:
 *   delete:
 *     summary: Delete an attachment
 *     tags: [Attachment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Attachment ID
 *     responses:
 *       200:
 *         description: Attachment deleted
 */
router.delete('/:id', authenticateUser, attachmentController.deleteAttachment);

export default router;
