/* eslint-disable @typescript-eslint/no-explicit-any */
import { Op, QueryTypes } from 'sequelize';
import Tenant, { TenantPlan, TenantSettings } from './tenantModel';
import User from '../user/userModel';
import { TENANT_BYPASS } from '../middleware/tenantContext';
import { sequelize } from '../config/db';

/**
 * Tenant Service
 *
 * Provides CRUD and business-logic operations for tenant management.
 * All queries use TENANT_BYPASS because tenant operations are inherently
 * cross-tenant (admin-only) or need to read the Tenant table itself
 * which doesn't scope by tenantId.
 */

// Helper to create bypass options (avoids repeated `as any` casts)
function bypass(extra: Record<string, unknown> = {}): unknown {
  return { [TENANT_BYPASS]: true, ...extra };
}

// ─── Read Operations ──────────────────────────────────────────────────────────

/**
 * Get a tenant by its ID.
 */
export async function getTenantById(id: string): Promise<Tenant | null> {
  return Tenant.findByPk(id, bypass());
}

/**
 * Get all tenants with optional filtering and pagination.
 */
export async function getAllTenants(
  options: {
    page?: number;
    limit?: number;
    status?: string;
    plan?: TenantPlan;
    search?: string;
  } = {}
): Promise<{ rows: Tenant[]; count: number }> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (options.status) {
    where.status = options.status;
  }

  if (options.plan) {
    where.plan = options.plan;
  }

  if (options.search) {
    where[Op.or as symbol] = [{ name: { [Op.iLike]: `%${options.search}%` } }, { domain: { [Op.iLike]: `%${options.search}%` } }];
  }

  return Tenant.findAndCountAll(
    bypass({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    })
  );
}

/**
 * Get tenant settings (the JSONB settings column).
 */
export async function getTenantSettings(tenantId: string): Promise<TenantSettings | null> {
  const tenant = await getTenantById(tenantId);
  return tenant?.settings ?? null;
}

// ─── Write Operations ─────────────────────────────────────────────────────────

/**
 * Create a new tenant.
 */
export async function createTenant(data: {
  name: string;
  domain?: string;
  logo?: string;
  plan?: TenantPlan;
  maxUsers?: number;
  maxStorageMB?: number;
  settings?: TenantSettings;
}): Promise<Tenant> {
  const tenant = await Tenant.create(
    {
      name: data.name,
      domain: data.domain,
      logo: data.logo,
      plan: data.plan || 'free',
      maxUsers: data.maxUsers || 5,
      maxStorageMB: data.maxStorageMB || 500,
      settings: data.settings || {},
      status: 'ACTIVE',
      isActive: true
    } as unknown,
    bypass()
  );
  return tenant as Tenant;
}

/**
 * Update a tenant's basic info.
 */
export async function updateTenant(
  tenantId: string,
  data: Partial<{
    name: string;
    domain: string;
    logo: string;
    status: string;
    plan: TenantPlan;
    maxUsers: number;
    maxStorageMB: number;
    isActive: boolean;
  }>
): Promise<Tenant | null> {
  const tenant = await getTenantById(tenantId);
  if (!tenant) return null;

  await tenant.update(data as unknown, bypass());
  return tenant;
}

/**
 * Update tenant settings (merge with existing).
 */
export async function updateTenantSettings(tenantId: string, settings: Partial<TenantSettings>): Promise<TenantSettings | null> {
  const tenant = await getTenantById(tenantId);
  if (!tenant) return null;

  const merged: TenantSettings = {
    ...(tenant.settings || {}),
    ...settings
  };

  await tenant.update({ settings: merged } as unknown, bypass());
  return merged;
}

// ─── Limit Checks ─────────────────────────────────────────────────────────────

export interface TenantUsage {
  tenantId: string;
  tenantName: string;
  plan: TenantPlan;
  users: { current: number; max: number; percentage: number };
  storage: { currentMB: number; maxMB: number; percentage: number };
  limits: {
    rateLimit: number; // requests per minute
  };
}

/**
 * Plan-based rate limits (requests per minute).
 */
const PLAN_RATE_LIMITS: Record<TenantPlan, number> = {
  free: 100,
  pro: 500,
  enterprise: 2000
};

/**
 * Check current tenant resource usage against limits.
 */
export async function checkTenantLimits(tenantId: string): Promise<TenantUsage | null> {
  const tenant = await getTenantById(tenantId);
  if (!tenant) return null;

  // Count current users for this tenant
  const userCount = (await User.count({ where: { tenantId } } as any)) as unknown as number;

  // Estimate storage usage (sum of attachment sizes, etc.)
  // This is a rough estimate. In production, track actual storage in a separate table.
  let storageMB = 0;
  try {
    const result = await sequelize.query<{ total_bytes: string }>(
      `SELECT COALESCE(SUM("fileSize"), 0) AS total_bytes
       FROM attachments
       WHERE "tenantId" = :tenantId`,
      {
        replacements: { tenantId },
        type: QueryTypes.SELECT
      }
    );
    if (result && result[0]) {
      storageMB = Math.round(parseInt(result[0].total_bytes || '0', 10) / (1024 * 1024));
    }
  } catch {
    // attachments table may not have fileSize column yet -- default to 0
    storageMB = 0;
  }

  const plan = tenant.plan || 'free';

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    plan,
    users: {
      current: userCount,
      max: tenant.maxUsers,
      percentage: tenant.maxUsers > 0 ? Math.round((userCount / tenant.maxUsers) * 100) : 0
    },
    storage: {
      currentMB: storageMB,
      maxMB: tenant.maxStorageMB,
      percentage: tenant.maxStorageMB > 0 ? Math.round((storageMB / tenant.maxStorageMB) * 100) : 0
    },
    limits: {
      rateLimit: PLAN_RATE_LIMITS[plan]
    }
  };
}

/**
 * Check if a tenant can add more users.
 * Returns true if the user count is below the max.
 */
export async function canAddUser(tenantId: string): Promise<boolean> {
  const usage = await checkTenantLimits(tenantId);
  if (!usage) return false;
  return usage.users.current < usage.users.max;
}

/**
 * Get the tenant associated with the current user (for non-admin use).
 * Returns a safe subset of tenant info (no internal settings).
 */
export async function getMyTenant(tenantId: string): Promise<Record<string, unknown> | null> {
  const tenant = await getTenantById(tenantId);
  if (!tenant) return null;

  return {
    id: tenant.id,
    name: tenant.name,
    domain: tenant.domain,
    logo: tenant.logo,
    status: tenant.status,
    plan: tenant.plan,
    maxUsers: tenant.maxUsers,
    maxStorageMB: tenant.maxStorageMB,
    isActive: tenant.isActive,
    createdAt: tenant.getDataValue('createdAt'),
    updatedAt: tenant.getDataValue('updatedAt')
  };
}
