import { Router } from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import * as tenantController from './tenantController';

const router = Router();

// ─── Superadmin Tenant Management ─────────────────────────────────────────────
// All routes require authentication + SUPER_ADMIN role (via MANAGE_SETTINGS permission)

// GET  /api/admin/tenants           - List all tenants
// POST /api/admin/tenants           - Create a new tenant
router
  .route('/')
  .get(authenticateUser, HasPermission(['MANAGE_SETTINGS']), tenantController.listTenants)
  .post(authenticateUser, HasPermission(['MANAGE_SETTINGS']), tenantController.createTenant);

// GET  /api/admin/tenants/:id       - Get tenant details
// PUT  /api/admin/tenants/:id       - Update tenant
router
  .route('/:id')
  .get(authenticateUser, HasPermission(['MANAGE_SETTINGS']), tenantController.getTenantById)
  .put(authenticateUser, HasPermission(['MANAGE_SETTINGS']), tenantController.updateTenant);

// PUT  /api/admin/tenants/:id/settings - Update tenant settings (JSONB merge)
router.route('/:id/settings').put(authenticateUser, HasPermission(['MANAGE_SETTINGS']), tenantController.updateTenantSettings);

// GET  /api/admin/tenants/:id/usage - Get tenant resource usage
router.route('/:id/usage').get(authenticateUser, HasPermission(['MANAGE_SETTINGS']), tenantController.getTenantUsage);

export default router;
