import { Router } from 'express';
import emailController from './emailController';
import emailTemplateController from './emailTemplateController';
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

// Email Composer Templates
router.get('/templates', authenticateUser, emailTemplateController.getTemplates);
router.get('/templates/:id', authenticateUser, emailTemplateController.getTemplate);
router.post('/templates', authenticateUser, emailTemplateController.createTemplate);
router.put('/templates/:id', authenticateUser, emailTemplateController.updateTemplate);
router.delete('/templates/:id', authenticateUser, emailTemplateController.deleteTemplate);

export default router;
