import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import playbookController from './playbookController';

const router = express.Router();

router.get('/', authenticateUser, playbookController.getPlaybooks);
router.get('/:id', authenticateUser, playbookController.getPlaybook);
router.post('/', authenticateUser, playbookController.createPlaybook);
router.put('/:id', authenticateUser, playbookController.updatePlaybook);
router.delete('/:id', authenticateUser, playbookController.deletePlaybook);

export default router;
