import express from 'express';
import leadScoringController from './leadScoringController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

// Grade thresholds (static config)
router.get('/grades', authenticateUser, leadScoringController.getGradeThresholds);

// Rules CRUD
router.get('/rules', authenticateUser, leadScoringController.getRules);
router.post('/rules', authenticateUser, leadScoringController.createRule);
router.put('/rules/:id', authenticateUser, leadScoringController.updateRule);
router.delete('/rules/:id', authenticateUser, leadScoringController.deleteRule);

// Score calculation
router.post('/calculate/:entityType/:entityId', authenticateUser, leadScoringController.calculateScore);
router.post('/calculate/:entityType', authenticateUser, leadScoringController.bulkCalculateScores);

// Score retrieval
router.get('/scores/:entityType/:entityId', authenticateUser, leadScoringController.getScore);
router.get('/top/:entityType', authenticateUser, leadScoringController.getTopScored);

export default router;
