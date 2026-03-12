import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import Tenant from '../tenant/tenantModel';
import { TENANT_BYPASS } from './tenantContext';
import logger from '../config/logger';

/**
 * Tenant validation middleware.
 *
 * Must be placed AFTER authenticateUser in the middleware chain.
 * It performs the following checks:
 *
 * 1. Extracts tenantId from the authenticated user (req.user.tenantId).
 * 2. Superadmin users (SUPER_ADMIN role) bypass all tenant checks.
 * 3. Rejects requests from users without a valid tenantId.
 * 4. Verifies the tenant exists and is active (not SUSPENDED).
 * 5. Attaches the full tenant object to req.tenant for downstream use.
 */
export const validateTenant = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Superadmin bypasses all tenant checks
    const isSuperAdmin = user.role?.name === 'SUPER_ADMIN' || user.role?.name === 'Super Admin';
    if (isSuperAdmin) {
      return next();
    }

    const tenantId = user.tenantId;
    if (!tenantId) {
      res.status(403).json({
        message: 'Tenant context required. Your account is not associated with any organization.'
      });
      return;
    }

    // Look up the tenant to verify it exists and is active.
    // Use TENANT_BYPASS so the global hooks don't scope this query.
    const tenant = await Tenant.findByPk(tenantId, {
      [TENANT_BYPASS]: true
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    if (!tenant) {
      res.status(403).json({
        message: 'Tenant not found. Your organization may have been removed.'
      });
      return;
    }

    if (tenant.status === 'SUSPENDED') {
      res.status(403).json({
        message: 'Your organization account has been suspended. Please contact support.'
      });
      return;
    }

    if (!tenant.isActive) {
      res.status(403).json({
        message: 'Your organization account is inactive. Please contact support.'
      });
      return;
    }

    // Attach tenant to request for downstream usage (rate limiter, controllers, etc.)
    req.tenant = tenant;

    next();
  } catch (error) {
    logger.error({ err: error }, '[TenantMiddleware] Error validating tenant');
    res.status(500).json({ message: 'Internal server error during tenant validation' });
  }
};

/**
 * Lightweight middleware that only checks tenantId presence on the user.
 * Does NOT hit the database. Use when you need fast tenant gating
 * without the overhead of a DB lookup (e.g., high-frequency endpoints).
 */
export const requireTenantId = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const isSuperAdmin = user.role?.name === 'SUPER_ADMIN' || user.role?.name === 'Super Admin';
  if (isSuperAdmin) {
    return next();
  }

  if (!user.tenantId) {
    res.status(403).json({
      message: 'Tenant context required. Your account is not associated with any organization.'
    });
    return;
  }

  next();
};
