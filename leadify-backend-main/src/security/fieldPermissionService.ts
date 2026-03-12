import FieldPermission, { FieldAccess } from './fieldPermissionModel';

/**
 * Get all field permissions for a specific role and entity type.
 */
export async function getFieldPermissions(roleId: string, entityType: string): Promise<FieldPermission[]> {
  const permissions = await FieldPermission.findAll({
    where: { roleId, entityType },
    order: [['fieldName', 'ASC']]
  });
  return permissions;
}

/**
 * Set a single field permission for a role/entity/field combination.
 * Uses upsert to create or update.
 */
export async function setFieldPermission(roleId: string, entityType: string, fieldName: string, access: FieldAccess): Promise<FieldPermission> {
  const [permission] = await FieldPermission.upsert(
    {
      roleId,
      entityType,
      fieldName,
      access
    },
    {
      conflictFields: ['roleId', 'entityType', 'fieldName'] as unknown
    }
  );
  return permission;
}

/**
 * Bulk set field permissions for a role and entity type.
 * Replaces all existing permissions for the role+entity combination.
 */
export async function bulkSetPermissions(
  roleId: string,
  entityType: string,
  permissions: Array<{ fieldName: string; access: FieldAccess }>
): Promise<FieldPermission[]> {
  // Remove all existing permissions for this role+entity
  await FieldPermission.destroy({
    where: { roleId, entityType }
  });

  if (!permissions || permissions.length === 0) return [];

  // Create new permissions in bulk
  const records = permissions.map(p => ({
    roleId,
    entityType,
    fieldName: p.fieldName,
    access: p.access
  }));

  const created = await FieldPermission.bulkCreate(records);
  return created;
}

/**
 * Filter entity data by removing hidden fields and marking non-editable fields.
 * Returns a new object with only the fields the role can see.
 */
export async function filterEntityFields<T extends Record<string, unknown>>(entity: T, roleId: string, entityType: string): Promise<Partial<T>> {
  const permissions = await FieldPermission.findAll({
    where: { roleId, entityType }
  });

  // If no permissions defined, return full entity (default: all visible)
  if (permissions.length === 0) return { ...entity };

  // Build a permission map
  const permissionMap = new Map<string, FieldAccess>();
  for (const p of permissions) {
    permissionMap.set(p.fieldName, p.access);
  }

  const filtered: Record<string, unknown> = {};
  for (const key of Object.keys(entity)) {
    const access = permissionMap.get(key);
    // If no explicit permission set for this field, default to VISIBLE
    if (!access || access === FieldAccess.VISIBLE || access === FieldAccess.EDITABLE) {
      filtered[key] = entity[key];
    }
    // HIDDEN fields are excluded
  }

  return filtered as Partial<T>;
}

/**
 * Get list of field names that are editable for a given role and entity type.
 */
export async function getEditableFields(roleId: string, entityType: string): Promise<string[]> {
  const permissions = await FieldPermission.findAll({
    where: { roleId, entityType, access: FieldAccess.EDITABLE }
  });
  return permissions.map(p => p.fieldName);
}

/**
 * Check the access level for a specific field.
 * Returns the access level, or VISIBLE as default if no explicit permission is set.
 */
export async function checkFieldAccess(roleId: string, entityType: string, fieldName: string): Promise<FieldAccess> {
  const permission = await FieldPermission.findOne({
    where: { roleId, entityType, fieldName }
  });
  return permission ? permission.access : FieldAccess.VISIBLE;
}
