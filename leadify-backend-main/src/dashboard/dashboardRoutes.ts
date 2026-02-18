import express from 'express';
import dashboardController from './dashboardController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

// Predefined analytics endpoints (must come before /:id routes)
router.get('/executive-summary', authenticateUser, dashboardController.getExecutiveSummary);
router.get('/pipeline', authenticateUser, dashboardController.getPipeline);
router.get('/revenue', authenticateUser, dashboardController.getRevenue);
router.get('/team-performance', authenticateUser, dashboardController.getTeamPerformance);

// Widget data
router.post('/widget-data', authenticateUser, dashboardController.getWidgetData);

// CRUD
router.get('/', authenticateUser, dashboardController.getDashboards);
router.get('/:id', authenticateUser, dashboardController.getDashboardById);
router.post('/', authenticateUser, dashboardController.createDashboard);
router.put('/:id', authenticateUser, dashboardController.updateDashboard);
router.delete('/:id', authenticateUser, dashboardController.deleteDashboard);
router.patch('/:id/default', authenticateUser, dashboardController.setDefault);

export default router;
