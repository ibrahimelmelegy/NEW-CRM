import express from 'express';
import timeTrackingController from './timeTrackingController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/start', authenticateUser, timeTrackingController.startTimer);
router.post('/stop', authenticateUser, timeTrackingController.stopTimer);
router.get('/running', authenticateUser, timeTrackingController.getRunningTimer);
router.get('/entries', authenticateUser, timeTrackingController.getEntries);
router.post('/entries', authenticateUser, timeTrackingController.createManualEntry);
router.put('/entries/:id', authenticateUser, timeTrackingController.updateEntry);
router.delete('/entries/:id', authenticateUser, timeTrackingController.deleteEntry);
router.get('/weekly', authenticateUser, timeTrackingController.getWeeklySummary);

export default router;
