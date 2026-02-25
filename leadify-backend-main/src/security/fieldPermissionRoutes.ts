import express, { Response, NextFunction } from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { wrapResult } from '../utils/response/responseWrapper';
import { AuthenticatedRequest } from '../types';
import { FieldAccess } from './fieldPermissionModel';
import { getFieldPermissions, bulkSetPermissions, getEditableFields, checkFieldAccess } from './fieldPermissionService';

const router = express.Router();

/**
 * @swagger
 * /api/security/field-permissions/{roleId}/{entityType}:
 *   get:
 *     summary: Get field permissions for a role and entity type
 *     description: Returns all field-level permissions configured for a specific role and entity type.
 *     tags: [Field Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Field permissions returned
 */
router.get(
  '/:roleId/:entityType',
  authenticateUser,
  HasPermission(['manage_roles', 'manage_security']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const roleId = req.params.roleId as string;
      const entityType = req.params.entityType as string;
      const permissions = await getFieldPermissions(roleId, entityType);
      wrapResult(res, permissions);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/security/field-permissions/{roleId}/{entityType}:
 *   put:
 *     summary: Bulk set field permissions for a role and entity type
 *     description: Replaces all field permissions for the given role/entity with the provided set.
 *     tags: [Field Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     fieldName:
 *                       type: string
 *                     access:
 *                       type: string
 *                       enum: [VISIBLE, EDITABLE, HIDDEN]
 *     responses:
 *       200:
 *         description: Field permissions updated
 *       400:
 *         description: Invalid input
 */
router.put(
  '/:roleId/:entityType',
  authenticateUser,
  HasPermission(['manage_roles', 'manage_security']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const roleId = req.params.roleId as string;
      const entityType = req.params.entityType as string;
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        res.status(400).json({ message: 'permissions must be an array of { fieldName, access }' });
        return;
      }

      // Validate access values
      const validAccess = Object.values(FieldAccess);
      for (const p of permissions) {
        if (!p.fieldName || !validAccess.includes(p.access)) {
          res.status(400).json({
            message: `Invalid permission entry. fieldName is required and access must be one of: ${validAccess.join(', ')}`
          });
          return;
        }
      }

      const result = await bulkSetPermissions(roleId, entityType, permissions);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/security/field-permissions/editable/{entityType}:
 *   get:
 *     summary: Get editable fields for the current user's role
 *     description: Returns the list of field names that the current user's role can edit for a given entity type.
 *     tags: [Field Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Editable field names returned
 */
router.get('/editable/:entityType', authenticateUser, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const entityType = req.params.entityType as string;
    const fields = await getEditableFields(req.user.roleId, entityType);
    wrapResult(res, fields);
  } catch (error) {
    next(error);
  }
});

export default router;
