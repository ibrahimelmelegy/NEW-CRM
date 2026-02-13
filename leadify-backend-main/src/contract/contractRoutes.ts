import express from 'express';
import contractController from './contractController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

// Authenticated routes
router.get('/', authenticateUser, contractController.getAll);
router.get('/:id', authenticateUser, contractController.getById);
router.post('/', authenticateUser, contractController.create);
router.put('/:id', authenticateUser, contractController.update);
router.delete('/:id', authenticateUser, contractController.delete);
router.post('/:id/send', authenticateUser, contractController.sendForSignature);

// Public signing routes (no auth)
router.get('/sign/:token', contractController.getByToken);
router.post('/sign/:token', contractController.sign);

export default router;
