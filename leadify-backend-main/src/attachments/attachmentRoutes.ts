import express from 'express';
import attachmentController from './attachmentController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticateUser, attachmentController.getAttachments);
router.post('/', authenticateUser, attachmentController.createAttachment);
router.delete('/:id', authenticateUser, attachmentController.deleteAttachment);

export default router;
