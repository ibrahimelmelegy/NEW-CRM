import { Router } from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import * as tenantController from './tenantController';

const router = Router();

// ─── Self-Service Tenant Info ─────────────────────────────────────────────────
// Accessible by any authenticated user to see their own tenant info

// GET /api/tenant/me     - Get current user's tenant info
router.get('/me', authenticateUser, tenantController.getMyTenant);

// GET /api/tenant/usage  - Get current user's tenant usage stats
router.get('/usage', authenticateUser, tenantController.getMyTenantUsage);

export default router;
