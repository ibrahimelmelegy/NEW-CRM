import { Op } from 'sequelize';
import { DataSharingRule, RecordShare, DefaultAccessLevel, ShareAccessLevel } from './dataShareModel';
import User from '../user/userModel';
import Role from '../role/roleModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';

/**
 * Get the default sharing/access rule for an entity type.
 */
export async function getDefaultAccess(entityType: string): Promise<DataSharingRule | null> {
  return DataSharingRule.findOne({ where: { entityType } });
}

/**
 * Get all data sharing rules.
 */
export async function getAllSharingRules(): Promise<DataSharingRule[]> {
  return DataSharingRule.findAll({ order: [['entityType', 'ASC']] });
}

/**
 * Set or update the default sharing rule for an entity type.
 */
export async function setDefaultAccess(
  entityType: string,
  defaultAccess: DefaultAccessLevel,
  hierarchyAccess: boolean,
  description?: string
): Promise<DataSharingRule> {
  const [rule] = await DataSharingRule.upsert({
    entityType,
    defaultAccess,
    hierarchyAccess,
    description: description || null
  });
  return rule;
}

/**
 * Share a specific record with a user or role.
 */
export async function shareRecord(
  entityType: string,
  entityId: string,
  sharedWith: { userId?: number; roleId?: string },
  accessLevel: ShareAccessLevel,
  sharedBy: number,
  expiresAt?: Date
): Promise<RecordShare> {
  if (!sharedWith.userId && !sharedWith.roleId) {
    throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400, 'Must specify either a userId or roleId to share with.');
  }

  // Check for existing share with same target
  const existingWhere: Record<string, any> = { entityType, entityId };
  if (sharedWith.userId) existingWhere.sharedWithUserId = sharedWith.userId;
  if (sharedWith.roleId) existingWhere.sharedWithRoleId = sharedWith.roleId;

  const existing = await RecordShare.findOne({ where: existingWhere });
  if (existing) {
    // Update existing share
    await existing.update({ accessLevel, expiresAt: expiresAt || null });
    return existing;
  }

  const share = await RecordShare.create({
    entityType,
    entityId,
    sharedWithUserId: sharedWith.userId || null,
    sharedWithRoleId: sharedWith.roleId || null,
    accessLevel,
    sharedBy,
    expiresAt: expiresAt || null
  });

  return share;
}

/**
 * Revoke a specific share by ID.
 */
export async function revokeShare(shareId: number): Promise<void> {
  const share = await RecordShare.findByPk(shareId);
  if (!share) {
    throw new BaseError(ERRORS.NOT_FOUND);
  }
  await share.destroy();
}

/**
 * Get all shares for a specific record.
 */
export async function getRecordShares(entityType: string, entityId: string): Promise<RecordShare[]> {
  const now = new Date();

  return RecordShare.findAll({
    where: {
      entityType,
      entityId,
      [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: now } }]
    },
    include: [
      { model: User, as: 'sharedWithUser', attributes: ['id', 'name', 'email'] },
      { model: User, as: 'sharedByUser', attributes: ['id', 'name', 'email'] }
    ],
    order: [['createdAt', 'DESC']]
  });
}

/**
 * Check if a user can access a specific record at the required access level.
 * Evaluates: default rules, hierarchy access, and explicit shares.
 */
export async function canUserAccess(
  userId: number,
  roleId: string,
  entityType: string,
  entityId: string,
  requiredAccess: ShareAccessLevel = ShareAccessLevel.READ
): Promise<boolean> {
  // 1. Check default sharing rule for the entity type
  const rule = await DataSharingRule.findOne({ where: { entityType } });
  if (rule) {
    const defaultLevel = rule.defaultAccess;
    if (defaultLevel === DefaultAccessLevel.FULL_ACCESS) return true;
    if (defaultLevel === DefaultAccessLevel.READ_WRITE && requiredAccess !== ShareAccessLevel.FULL) return true;
    if (defaultLevel === DefaultAccessLevel.READ_ONLY && requiredAccess === ShareAccessLevel.READ) return true;
    // PRIVATE - check explicit shares below
  }

  // 2. Check explicit user share
  const now = new Date();
  const userShare = await RecordShare.findOne({
    where: {
      entityType,
      entityId,
      sharedWithUserId: userId,
      [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: now } }]
    }
  });

  if (userShare && meetsAccessLevel(userShare.accessLevel, requiredAccess)) {
    return true;
  }

  // 3. Check role-based share
  const roleShare = await RecordShare.findOne({
    where: {
      entityType,
      entityId,
      sharedWithRoleId: roleId,
      [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: now } }]
    }
  });

  if (roleShare && meetsAccessLevel(roleShare.accessLevel, requiredAccess)) {
    return true;
  }

  return false;
}

/**
 * Get all record IDs of a given entity type that a user can access.
 * Useful for filtering query results by accessible records.
 */
export async function getAccessibleRecordIds(userId: number, roleId: string, entityType: string): Promise<{ ids: string[]; fullAccess: boolean }> {
  // Check default sharing rule
  const rule = await DataSharingRule.findOne({ where: { entityType } });
  if (rule) {
    // If default access is READ_ONLY or higher, user can access all records
    if (
      rule.defaultAccess === DefaultAccessLevel.READ_ONLY ||
      rule.defaultAccess === DefaultAccessLevel.READ_WRITE ||
      rule.defaultAccess === DefaultAccessLevel.FULL_ACCESS
    ) {
      return { ids: [], fullAccess: true };
    }
  }

  // For PRIVATE, collect explicitly shared record IDs
  const now = new Date();
  const shares = await RecordShare.findAll({
    where: {
      entityType,
      [Op.or]: [{ sharedWithUserId: userId }, { sharedWithRoleId: roleId }],
      [Op.and]: [
        {
          [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: now } }]
        }
      ]
    },
    attributes: ['entityId']
  });

  const ids = [...new Set(shares.map(s => s.entityId))];
  return { ids, fullAccess: false };
}

// --- Internal helpers ---

/**
 * Check if a granted access level meets or exceeds the required level.
 */
function meetsAccessLevel(granted: ShareAccessLevel, required: ShareAccessLevel): boolean {
  const levels: Record<ShareAccessLevel, number> = {
    [ShareAccessLevel.READ]: 1,
    [ShareAccessLevel.WRITE]: 2,
    [ShareAccessLevel.FULL]: 3
  };
  return levels[granted] >= levels[required];
}
