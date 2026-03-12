import { Op, WhereOptions } from 'sequelize';
import AuditTrail, { AuditAction, AuditFieldChange, AuditMetadata } from './auditModel';
import User from '../user/userModel';

// Fields that should never appear in audit diffs
const IGNORED_FIELDS = new Set(['updatedAt', 'createdAt', 'deletedAt', 'password', 'twoFactorSecret']);

/**
 * Compare two objects and produce an array of field-level changes.
 * Handles null/undefined, date normalization, and nested JSON.
 */
export function diffObjects(oldObj: Record<string, unknown>, newObj: Record<string, unknown>, fieldLabels?: Record<string, string>): AuditFieldChange[] {
  const changes: AuditFieldChange[] = [];

  for (const key of Object.keys(newObj)) {
    if (IGNORED_FIELDS.has(key)) continue;

    const oldVal = oldObj[key];
    const newVal = newObj[key];

    // Skip if both are the same reference
    if (oldVal === newVal) continue;

    // Normalize: treat null and undefined as equivalent
    if (oldVal == null && newVal == null) continue;

    // Normalize dates to ISO strings for comparison
    const normalizedOld = normalizeValue(oldVal);
    const normalizedNew = normalizeValue(newVal);

    // Deep comparison for objects/arrays via JSON serialization
    if (typeof normalizedOld === 'object' || typeof normalizedNew === 'object') {
      if (JSON.stringify(normalizedOld) === JSON.stringify(normalizedNew)) continue;
    } else {
      // For primitives, use strict string comparison to catch type coercion
      if (String(normalizedOld) === String(normalizedNew)) continue;
    }

    changes.push({
      field: key,
      oldValue: normalizedOld ?? null,
      newValue: normalizedNew ?? null,
      fieldLabel: fieldLabels?.[key] || undefined
    });
  }

  return changes;
}

function normalizeValue(val: unknown): unknown {
  if (val instanceof Date) return val.toISOString();
  return val;
}

/**
 * Create an audit trail entry.
 */
export async function logChange(
  entityType: string,
  entityId: string | number,
  action: AuditAction,
  userId: number,
  changes?: AuditFieldChange[],
  metadata?: AuditMetadata
): Promise<AuditTrail> {
  return AuditTrail.create({
    entityType,
    entityId: String(entityId),
    action,
    userId,
    changes: changes || [],
    metadata: metadata || {}
  });
}

/**
 * Get paginated audit trail for a specific entity.
 */
export async function getAuditTrail(entityType: string, entityId: string | number, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;

  const { rows: docs, count: totalItems } = await AuditTrail.findAndCountAll({
    where: {
      entityType,
      entityId: String(entityId)
    },
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'profilePicture']
      }
    ]
  });

  return {
    docs,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit)
    }
  };
}

/**
 * Get the change history for a specific field on a specific entity.
 */
export async function getFieldHistory(entityType: string, entityId: string | number, fieldName: string) {
  // Fetch all audit entries for this entity that have changes for the specified field.
  // We use a JSONB query to filter only entries where the changes array contains
  // an object with the matching field name.
  const entries = await AuditTrail.findAll({
    where: {
      entityType,
      entityId: String(entityId),
      changes: {
        [Op.contains]: [{ field: fieldName }] as any
      }
    },
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'profilePicture']
      }
    ]
  });

  // Extract only the relevant field change from each entry
  return entries.map(entry => {
    const entryJson = entry.toJSON() as Record<string, unknown>;
    const fieldChange = entryJson.changes?.find((c: AuditFieldChange) => c.field === fieldName);
    return {
      id: entryJson.id,
      action: entryJson.action,
      userId: entryJson.userId,
      user: entryJson.user,
      oldValue: fieldChange?.oldValue ?? null,
      newValue: fieldChange?.newValue ?? null,
      fieldLabel: fieldChange?.fieldLabel,
      createdAt: entryJson.createdAt
    };
  });
}

/**
 * Get paginated audit log for a specific user.
 */
export async function getUserAuditLog(userId: number, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;

  const { rows: docs, count: totalItems } = await AuditTrail.findAndCountAll({
    where: { userId },
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'profilePicture']
      }
    ]
  });

  return {
    docs,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit)
    }
  };
}

export interface AuditLogFilters {
  entityType?: string;
  userId?: number;
  action?: AuditAction;
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
  page?: number;
  limit?: number;
}

/**
 * Get all audit logs with filters (admin endpoint).
 */
export async function getAllAuditLogs(filters: AuditLogFilters) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  const where: WhereOptions = {};

  if (filters.entityType) {
    where.entityType = filters.entityType;
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      (where[createdAt] as Record<string, unknown>)[Op.gte] = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      (where[createdAt] as Record<string, unknown>)[Op.lte] = new Date(filters.dateTo);
    }
  }

  const { rows: docs, count: totalItems } = await AuditTrail.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'profilePicture']
      }
    ]
  });

  return {
    docs,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit)
    }
  };
}
