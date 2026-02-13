import express from 'express';
import campaignController from './campaignController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticateUser, campaignController.getCampaigns);
router.get('/templates', authenticateUser, campaignController.getTemplates);
router.post('/templates', authenticateUser, campaignController.createTemplate);
router.delete('/templates/:id', authenticateUser, campaignController.deleteTemplate);
router.get('/:id', authenticateUser, campaignController.getCampaignById);
router.post('/', authenticateUser, campaignController.create);
router.put('/:id', authenticateUser, campaignController.update);
router.delete('/:id', authenticateUser, campaignController.delete);
router.post('/:id/send', authenticateUser, campaignController.send);
router.get('/:id/analytics', authenticateUser, campaignController.getAnalytics);

export default router;
