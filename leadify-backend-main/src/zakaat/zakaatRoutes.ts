import express from 'express';
import zakaatController from './zakaatController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

// List assessments
router.get('/assessments', authenticateUser, zakaatController.getAssessments);

// Get single assessment
router.get('/assessments/:id', authenticateUser, zakaatController.getAssessment);

// Create assessment
router.post('/assessments', authenticateUser, zakaatController.createAssessment);

// Update assessment
router.put('/assessments/:id', authenticateUser, zakaatController.updateAssessment);

// Recalculate Zakaat for existing assessment
router.post('/assessments/:id/calculate', authenticateUser, zakaatController.recalculate);

// Generate report data
router.get('/assessments/:id/report', authenticateUser, zakaatController.getReport);

export default router;
