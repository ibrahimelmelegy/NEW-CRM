import express from 'express';
import commentController from './commentController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticateUser, commentController.getComments);
router.post('/', authenticateUser, commentController.createComment);
router.put('/:id', authenticateUser, commentController.updateComment);
router.delete('/:id', authenticateUser, commentController.deleteComment);

export default router;
