import express from 'express';
import customReportController from './customReportController';
import reportBuilderController from './reportBuilderController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

// ─── Report Builder Pro endpoints ────────────────────────────
router.get('/builder/fields', authenticateUser, reportBuilderController.getAllFields);
router.get('/builder/fields/:module', authenticateUser, reportBuilderController.getModuleFields);
router.post('/builder/preview', authenticateUser, reportBuilderController.previewReport);
router.post('/builder/export', authenticateUser, reportBuilderController.exportFromConfig);

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

// ─── Report Builder Pro: saved report actions ────────────────
router.post('/:id/export', authenticateUser, reportBuilderController.exportReport);
router.put('/:id/schedule', authenticateUser, reportBuilderController.scheduleReport);

export default router;
