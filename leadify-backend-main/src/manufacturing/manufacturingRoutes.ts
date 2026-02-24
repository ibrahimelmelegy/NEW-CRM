import { Router } from 'express';
import manufacturingController from './manufacturingController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateUser);

// BOM
router.get('/bom', manufacturingController.getBOMs);
router.get('/bom/:id', manufacturingController.getBOMById);
router.post('/bom', manufacturingController.createBOM);
router.patch('/bom/:id', manufacturingController.updateBOM);
router.delete('/bom/:id', manufacturingController.deleteBOM);
router.post('/bom/:id/duplicate', manufacturingController.duplicateBOM);

// Work Orders
router.get('/work-orders', manufacturingController.getWorkOrders);
router.get('/work-orders/:id', manufacturingController.getWorkOrderById);
router.post('/work-orders', manufacturingController.createWorkOrder);
router.patch('/work-orders/:id', manufacturingController.updateWorkOrder);
router.patch('/work-orders/:id/production', manufacturingController.updateProduction);

// Quality Checks
router.get('/quality', manufacturingController.getQualityChecks);
router.post('/quality', manufacturingController.createQualityCheck);

// Stats
router.get('/stats', manufacturingController.getStats);

export default router;
