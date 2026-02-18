import { Router } from 'express';
import approvalController from './approvalController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

// Workflow routes
router.get('/workflows', authenticateUser, approvalController.getWorkflows);
router.post('/workflows', authenticateUser, approvalController.createWorkflow);
router.put('/workflows/:id', authenticateUser, approvalController.updateWorkflow);
router.delete('/workflows/:id', authenticateUser, approvalController.deleteWorkflow);

// Request routes
router.get('/requests', authenticateUser, approvalController.getRequests);
router.get('/requests/pending', authenticateUser, approvalController.getPendingApprovals);
router.post('/requests', authenticateUser, approvalController.createRequest);
router.post('/requests/:id/approve', authenticateUser, approvalController.approveStep);
router.post('/requests/:id/reject', authenticateUser, approvalController.rejectStep);
router.post('/requests/:id/cancel', authenticateUser, approvalController.cancelRequest);

export default router;
