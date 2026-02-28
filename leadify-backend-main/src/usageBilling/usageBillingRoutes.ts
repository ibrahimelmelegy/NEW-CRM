import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import controller from './usageBillingController';

const router = express.Router();

// ─── Billing Actions ────────────────────────────────────────────────────────
router.get('/charges', authenticateUser, controller.calculateCharges);
router.post('/invoice', authenticateUser, controller.generateInvoice);

// ─── Usage Records ──────────────────────────────────────────────────────────
router.get('/records', authenticateUser, controller.getUsageRecords);
router.post('/records', authenticateUser, controller.recordUsage);

// ─── Meter CRUD ─────────────────────────────────────────────────────────────
router.get('/meters', authenticateUser, controller.getAllMeters);
router.get('/meters/:id', authenticateUser, controller.getMeterById);
router.post('/meters', authenticateUser, controller.createMeter);
router.put('/meters/:id', authenticateUser, controller.updateMeter);
router.delete('/meters/:id', authenticateUser, controller.deleteMeter);

export default router;
