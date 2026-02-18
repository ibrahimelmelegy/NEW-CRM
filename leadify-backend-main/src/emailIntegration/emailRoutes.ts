import { Router } from 'express';
import emailController from './emailController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

// Account routes
router.get('/accounts', authenticateUser, emailController.getAccounts);
router.post('/accounts', authenticateUser, emailController.connectAccount);
router.delete('/accounts/:id', authenticateUser, emailController.disconnectAccount);

// Message routes
router.get('/messages', authenticateUser, emailController.getMessages);
router.post('/messages/send', authenticateUser, emailController.sendEmail);

// Tracking routes
router.get('/tracking/:messageId', authenticateUser, emailController.getTracking);

export default router;
