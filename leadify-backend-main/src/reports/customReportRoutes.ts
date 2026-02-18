import express from 'express';
import customReportController from './customReportController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

// Entity type introspection (must come before /:id routes)
router.get('/entity-types', authenticateUser, customReportController.getEntityTypes);
router.get('/fields/:entityType', authenticateUser, customReportController.getAvailableFields);

// CRUD
router.get('/', authenticateUser, customReportController.getReports);
router.get('/:id', authenticateUser, customReportController.getReportById);
router.post('/', authenticateUser, customReportController.createReport);
router.put('/:id', authenticateUser, customReportController.updateReport);
router.delete('/:id', authenticateUser, customReportController.deleteReport);

// Execution & Export
router.post('/:id/execute', authenticateUser, customReportController.executeReport);
router.get('/:id/export/:format', authenticateUser, customReportController.exportReport);

export default router;
