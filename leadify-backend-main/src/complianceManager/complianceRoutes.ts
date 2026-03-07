import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import controller from './complianceController';

const router = express.Router();

router.get('/', authenticateUser, controller.getAllConsents);

// ─── Audit & Score (before parameterised routes) ────────────────────────────
router.post('/audit', authenticateUser, controller.runAudit);
router.get('/score', authenticateUser, controller.getComplianceScore);

// ─── Consent Records ────────────────────────────────────────────────────────
router.get('/consents', authenticateUser, controller.getAllConsents);
router.get('/consents/:id', authenticateUser, controller.getConsentById);
router.post('/consents', authenticateUser, controller.createConsent);
router.put('/consents/:id', authenticateUser, controller.updateConsent);
router.delete('/consents/:id', authenticateUser, controller.deleteConsent);

// ─── Data Requests ──────────────────────────────────────────────────────────
router.get('/data-requests', authenticateUser, controller.getAllDataRequests);
router.get('/data-requests/:id', authenticateUser, controller.getDataRequestById);
router.post('/data-requests', authenticateUser, controller.createDataRequest);
router.put('/data-requests/:id/process', authenticateUser, controller.processDataRequest);

export default router;
