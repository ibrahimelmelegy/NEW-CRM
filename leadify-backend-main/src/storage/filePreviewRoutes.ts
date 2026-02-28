import express, { Response, NextFunction } from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import filePreviewService from './filePreviewService';

/**
 * @swagger
 * tags:
 *   name: FilePreview
 *   description: File preview, thumbnail, and metadata endpoints
 */

const router = express.Router();

/**
 * @swagger
 * /api/files/{id}/preview:
 *   get:
 *     summary: Get file preview URL
 *     tags: [FilePreview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Preview URL with content type and previewable flag
 */
router.get('/:id/preview', authenticateUser, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const fileId = parseInt(req.params.id as string, 10);
    const result = await filePreviewService.getPreviewUrl(fileId);
    return wrapResult(res, result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/files/{id}/thumbnail:
 *   get:
 *     summary: Get file thumbnail
 *     tags: [FilePreview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *           enum: [small, medium, large]
 *           default: medium
 *     responses:
 *       200:
 *         description: Thumbnail URL with dimensions
 */
router.get('/:id/thumbnail', authenticateUser, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const fileId = parseInt(req.params.id as string, 10);
    const size = (req.query.size as 'small' | 'medium' | 'large') || 'medium';
    const result = await filePreviewService.getThumbnail(fileId, size);
    return wrapResult(res, result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/files/{id}/metadata:
 *   get:
 *     summary: Get file metadata
 *     tags: [FilePreview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: File metadata including type, size, category, and dimensions
 */
router.get('/:id/metadata', authenticateUser, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const fileId = parseInt(req.params.id as string, 10);
    const result = await filePreviewService.getFileMetadata(fileId);
    return wrapResult(res, result);
  } catch (error) {
    next(error);
  }
});

export default router;
