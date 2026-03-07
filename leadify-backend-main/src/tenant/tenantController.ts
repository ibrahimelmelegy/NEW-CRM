import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import * as tenantService from './tenantService';
import { TenantPlan } from './tenantModel';

// ─── Superadmin Endpoints ─────────────────────────────────────────────────────

/**
 * GET /api/admin/tenants
 * List all tenants with pagination and filtering. Superadmin only.
 */
export const listTenants = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, status, plan, search } = req.query;
    const result = await tenantService.getAllTenants({
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
      status: status as string | undefined,
      plan: plan as TenantPlan | undefined,
      search: search as string | undefined
    });

    wrapResult(res, {
      tenants: result.rows,
      pagination: {
        total: result.count,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
        totalPages: Math.ceil(result.count / (limit ? parseInt(limit as string, 10) : 20))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/tenants/:id
 * Get a specific tenant by ID. Superadmin only.
 */
export const getTenantById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const tenant = await tenantService.getTenantById(id);

    if (!tenant) {
      res.status(404).json({ message: 'Tenant not found' });
      return;
    }

    wrapResult(res, tenant);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/tenants
 * Create a new tenant. Superadmin only.
 */
export const createTenant = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, domain, logo, plan, maxUsers, maxStorageMB, settings } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Tenant name is required' });
      return;
    }

    const tenant = await tenantService.createTenant({
      name,
      domain,
      logo,
      plan,
      maxUsers,
      maxStorageMB,
      settings
    });

    wrapResult(res, tenant, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/tenants/:id
 * Update a tenant. Superadmin only.
 */
export const updateTenant = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, domain, logo, status, plan, maxUsers, maxStorageMB, isActive } = req.body;

    const tenant = await tenantService.updateTenant(id, {
      name,
      domain,
      logo,
      status,
      plan,
      maxUsers,
      maxStorageMB,
      isActive
    });

    if (!tenant) {
      res.status(404).json({ message: 'Tenant not found' });
      return;
    }

    wrapResult(res, tenant);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/tenants/:id/settings
 * Update tenant settings (JSONB merge). Superadmin only.
 */
export const updateTenantSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const settings = req.body;

    if (!settings || typeof settings !== 'object') {
      res.status(400).json({ message: 'Settings object is required' });
      return;
    }

    const updated = await tenantService.updateTenantSettings(id, settings);

    if (!updated) {
      res.status(404).json({ message: 'Tenant not found' });
      return;
    }

    wrapResult(res, { settings: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/tenants/:id/usage
 * Get tenant resource usage and limits. Superadmin only.
 */
export const getTenantUsage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const usage = await tenantService.checkTenantLimits(id);

    if (!usage) {
      res.status(404).json({ message: 'Tenant not found' });
      return;
    }

    wrapResult(res, usage);
  } catch (error) {
    next(error);
  }
};

// ─── Tenant-User Endpoints (non-admin) ────────────────────────────────────────

/**
 * GET /api/tenant/me
 * Get the current user's tenant info. Any authenticated user.
 */
export const getMyTenant = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      res.status(403).json({ message: 'No tenant associated with your account' });
      return;
    }

    const tenantInfo = await tenantService.getMyTenant(tenantId);
    if (!tenantInfo) {
      res.status(404).json({ message: 'Tenant not found' });
      return;
    }

    wrapResult(res, tenantInfo);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tenant/usage
 * Get the current user's tenant usage. Any authenticated user.
 */
export const getMyTenantUsage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      res.status(403).json({ message: 'No tenant associated with your account' });
      return;
    }

    const usage = await tenantService.checkTenantLimits(tenantId);
    if (!usage) {
      res.status(404).json({ message: 'Tenant not found' });
      return;
    }

    wrapResult(res, usage);
  } catch (error) {
    next(error);
  }
};
