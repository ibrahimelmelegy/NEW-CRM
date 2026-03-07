import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AuditAction } from './auditModel';
import { diffObjects, logChange } from './auditService';

/** Any Sequelize model class that has findByPk and toJSON on its instances */
interface AuditableModel {
  findByPk(id: string | number): Promise<{ toJSON(): Record<string, any> } | null>;
}

/**
 * Generic middleware factory that automatically captures field-level changes
 * on any update route. It reads the current DB state before the update handler
 * runs, then after the response is sent it diffs the old vs new state and
 * writes an audit trail entry.
 *
 * Usage:
 *   router.put('/:id', authenticateUser, auditUpdate('lead', Lead), leadController.update);
 *
 * @param entityType - Logical entity name (e.g. 'lead', 'deal', 'client')
 * @param modelClass - The Sequelize model class to fetch the current record from
 * @param options    - Optional configuration
 */
export function auditUpdate(
  entityType: string,
  modelClass: AuditableModel,
  options?: {
    /** Param name that holds the entity ID. Default: 'id' */
    idParam?: string;
    /** Human-readable labels for field names, e.g. { firstName: 'First Name' } */
    fieldLabels?: Record<string, string>;
    /** Override how the action is determined. Default: 'UPDATE' */
    actionResolver?: (req: AuthenticatedRequest, oldRecord: Record<string, any>) => AuditAction;
  }
) {
  const idParam = options?.idParam || 'id';
  const fieldLabels = options?.fieldLabels;
  const actionResolver = options?.actionResolver;

  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      const entityId = req.params[idParam] as string;
      if (!entityId) {
        return next();
      }

      // Fetch the current state of the record before the update
      const currentRecord = await modelClass.findByPk(entityId);
      if (!currentRecord) {
        // Record doesn't exist - nothing to diff against; let the handler return 404
        return next();
      }

      const oldValues = currentRecord.toJSON() as Record<string, any>;

      // Store old values on the request so the handler can proceed normally
      (req as any)._auditOldValues = oldValues;
      (req as any)._auditEntityType = entityType;
      (req as any)._auditEntityId = entityId;
      (req as any)._auditFieldLabels = fieldLabels;
      (req as any)._auditActionResolver = actionResolver;
      (req as any)._auditModelClass = modelClass;

      // Hook into res.json/res.send to capture when the response is sent (success path)
      const originalJson = _res.json.bind(_res);
      _res.json = function auditedJson(body: any) {
        // Only log if the response indicates success (2xx)
        if (_res.statusCode >= 200 && _res.statusCode < 300) {
          // Fire-and-forget: do not block the response
          captureAuditAfterUpdate(req).catch(err => {
            console.error('[AuditMiddleware] Failed to write audit log:', err);
          });
        }
        return originalJson(body);
      };

      const originalSend = _res.send.bind(_res);
      _res.send = function auditedSend(body: any) {
        if (_res.statusCode >= 200 && _res.statusCode < 300) {
          captureAuditAfterUpdate(req).catch(err => {
            console.error('[AuditMiddleware] Failed to write audit log:', err);
          });
        }
        return originalSend(body);
      };

      next();
    } catch (error) {
      // Don't let audit middleware break the request
      console.error('[AuditMiddleware] Error in pre-handler:', error);
      next();
    }
  };
}

/**
 * After the handler has processed the update, re-fetch the record from DB
 * and diff it against the snapshot we took before the update.
 */
async function captureAuditAfterUpdate(req: AuthenticatedRequest): Promise<void> {
  const oldValues = (req as any)._auditOldValues as Record<string, any> | undefined;
  const entityType = (req as any)._auditEntityType as string | undefined;
  const entityId = (req as any)._auditEntityId as string | undefined;
  const fieldLabels = (req as any)._auditFieldLabels as Record<string, string> | undefined;
  const actionResolver = (req as any)._auditActionResolver as ((req: AuthenticatedRequest, old: Record<string, any>) => AuditAction) | undefined;
  const modelClass = (req as any)._auditModelClass as AuditableModel | undefined;

  if (!oldValues || !entityType || !entityId || !modelClass) return;

  // Prevent double-logging (send + json both fire)
  if ((req as any)._auditLogged) return;
  (req as any)._auditLogged = true;

  // Re-fetch the updated record
  const updatedRecord = await modelClass.findByPk(entityId);
  if (!updatedRecord) return;

  const newValues = updatedRecord.toJSON() as Record<string, any>;
  const changes = diffObjects(oldValues, newValues, fieldLabels);

  // If nothing actually changed, skip the audit entry
  if (changes.length === 0) return;

  // Determine the action type
  let action = AuditAction.UPDATE;
  if (actionResolver) {
    action = actionResolver(req, oldValues);
  } else if (changes.some(c => c.field === 'status')) {
    action = AuditAction.STATUS_CHANGE;
  } else if (changes.some(c => c.field === 'assignedTo' || c.field === 'userId' || c.field.endsWith('Id'))) {
    // Heuristic: if only assignment-related fields changed, mark as ASSIGNMENT
    const assignmentFields = changes.filter(c => c.field === 'assignedTo' || c.field === 'userId' || c.field.endsWith('Id'));
    if (assignmentFields.length === changes.length) {
      action = AuditAction.ASSIGNMENT;
    }
  }

  const metadata = {
    ipAddress: req.ip || req.socket?.remoteAddress,
    userAgent: req.get('user-agent')
  };

  await logChange(entityType, entityId, action, req.user!.id, changes, metadata);
}

/**
 * Convenience middleware for CREATE actions. Call this AFTER the handler has
 * created the record to log the creation with all initial field values.
 *
 * Usage in a controller:
 *   const created = await Lead.create(req.body);
 *   await auditCreate('lead', created.id, req);
 */
export async function auditCreate(
  entityType: string,
  entityId: string | number,
  req: AuthenticatedRequest,
  fieldLabels?: Record<string, string>
): Promise<void> {
  const changes: { field: string; oldValue: null; newValue: any; fieldLabel?: string }[] = [];

  // Log all non-meta fields from the request body as "created" values
  const body = req.body || {};
  for (const [key, value] of Object.entries(body)) {
    if (['password', 'twoFactorSecret', 'createdAt', 'updatedAt'].includes(key)) continue;
    changes.push({
      field: key,
      oldValue: null,
      newValue: value,
      fieldLabel: fieldLabels?.[key]
    });
  }

  const metadata = {
    ipAddress: req.ip || req.socket?.remoteAddress,
    userAgent: req.get('user-agent')
  };

  await logChange(entityType, String(entityId), AuditAction.CREATE, req.user!.id, changes, metadata);
}

/**
 * Convenience function for DELETE actions.
 *
 * Usage in a controller:
 *   await auditDelete('lead', id, req, existingRecord.toJSON());
 */
export async function auditDelete(
  entityType: string,
  entityId: string | number,
  req: AuthenticatedRequest,
  deletedData?: Record<string, any>
): Promise<void> {
  const changes: { field: string; oldValue: any; newValue: null }[] = [];

  if (deletedData) {
    for (const [key, value] of Object.entries(deletedData)) {
      if (['password', 'twoFactorSecret', 'createdAt', 'updatedAt', 'deletedAt'].includes(key)) continue;
      changes.push({
        field: key,
        oldValue: value,
        newValue: null
      });
    }
  }

  const metadata = {
    ipAddress: req.ip || req.socket?.remoteAddress,
    userAgent: req.get('user-agent')
  };

  await logChange(entityType, String(entityId), AuditAction.DELETE, req.user!.id, changes, metadata);
}
