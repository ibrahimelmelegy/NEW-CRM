import express from 'express';
import { generateEmail, summarizeMeeting, getChurnDashboard } from './aiController';
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

export default router;
