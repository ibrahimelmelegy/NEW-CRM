import express from 'express';
import integrationController from './integrationController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticateUser, integrationController.getIntegrations);
router.post('/', authenticateUser, integrationController.upsertIntegration);
router.delete('/:id', authenticateUser, integrationController.deleteIntegration);

// OAuth Callbacks
router.get('/google/callback', integrationController.handleGoogleCallback);
router.get('/outlook/callback', integrationController.handleOutlookCallback);
router.post('/google/auth-url', authenticateUser, integrationController.getGoogleAuthUrl);

export default router;
