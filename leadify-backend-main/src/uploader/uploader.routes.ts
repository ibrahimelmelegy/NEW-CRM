import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validation';
import uploaderController from './uploader.controller';
import { UploaderInput } from './uploader.input';

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: File upload service
 */

const router = express.Router();

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a file
 *     description: Uploads a file for a specific model (project, user, proposal, client, setting)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - model
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload
 *               model:
 *                 type: string
 *                 enum: [PROJECT, USER, PROPOSAL, CLIENT, SETTING]
 *                 description: The model context for the upload
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *       400:
 *         description: Validation error or no file provided
 *       500:
 *         description: Server error
 */
router.post('/', authenticateUser, validateBody(UploaderInput), uploaderController.Upload);

export default router;
