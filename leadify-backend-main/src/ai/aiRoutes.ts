import express from 'express';
import { generateEmail, summarizeMeeting, getChurnDashboard } from './aiController';
import salesCoachController from './salesCoachController';
import { aiChatController, aiDealController, aiEmailController, aiInsightsController } from './aiEnhancedController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { LeadAndSalesWidgetsPermissionsEnum } from '../role/roleEnum';

const router = express.Router();

// Protected routes
router.post('/generate-email', authenticateUser, generateEmail);
router.post('/summarize-meeting', authenticateUser, summarizeMeeting);
router.get(
    '/churn-dashboard',
    authenticateUser,
    HasPermission([
        LeadAndSalesWidgetsPermissionsEnum.VIEW_GLOBAL_LEAD_SALES_WIDGETS,
        LeadAndSalesWidgetsPermissionsEnum.VIEW_OWN_LEAD_SALES_WIDGETS
    ]),
    getChurnDashboard
);

// Sales Coach routes
router.get('/sales-coach/deal/:id', authenticateUser, salesCoachController.analyzeDeal);
router.get('/sales-coach/pipeline', authenticateUser, salesCoachController.getPipelineHealth);
router.get('/sales-coach/weekly-summary', authenticateUser, salesCoachController.getWeeklySummary);

// AI Chat routes
router.post('/chat', authenticateUser, aiChatController.askCRM);
router.post('/chat/clear', authenticateUser, aiChatController.clearChat);

// Deal Scoring routes
router.post('/score-deal/:dealId', authenticateUser, aiDealController.scoreDeal);

// Email AI routes
router.post('/email/generate', authenticateUser, aiEmailController.generateEmail);
router.post('/email/suggest-reply', authenticateUser, aiEmailController.suggestReply);
router.post('/email/improve', authenticateUser, aiEmailController.improveEmail);

// Daily Insights
router.get('/insights/daily', authenticateUser, aiInsightsController.getDailyInsights);

export default router;
