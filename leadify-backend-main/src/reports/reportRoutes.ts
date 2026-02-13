import express from 'express';
import reportController from './reportController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticateUser, reportController.getReports);
router.post('/', authenticateUser, reportController.createReport);
router.put('/:id', authenticateUser, reportController.updateReport);
router.delete('/:id', authenticateUser, reportController.deleteReport);
router.post('/execute', authenticateUser, reportController.executeReport);
router.post('/export-csv', authenticateUser, reportController.exportCSV);

export default router;
