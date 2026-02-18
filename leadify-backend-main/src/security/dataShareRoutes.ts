import express, { Response, NextFunction } from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { wrapResult } from '../utils/response/responseWrapper';
import { AuthenticatedRequest } from '../types';
import { DefaultAccessLevel, ShareAccessLevel } from './dataShareModel';
import {
  getAllSharingRules,
  setDefaultAccess,
  shareRecord,
  revokeShare,
  getRecordShares
} from './dataShareService';

const router = express.Router();

/**
 * @swagger
 * /api/security/sharing-rules:
 *   get:
 *     summary: List all data sharing rules
 *     description: Returns default sharing/access rules for all entity types.
 *     tags: [Data Sharing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sharing rules returned
 */
router.get(
  '/sharing-rules',
  authenticateUser,
  HasPermission(['manage_security']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const rules = await getAllSharingRules();
      wrapResult(res, rules);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/security/sharing-rules/{entityType}:
 *   put:
 *     summary: Set default sharing rule for an entity type
 *     description: Creates or updates the default access level for a given entity type.
 *     tags: [Data Sharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *               defaultAccess:
 *                 type: string
 *                 enum: [PRIVATE, READ_ONLY, READ_WRITE, FULL_ACCESS]
 *               hierarchyAccess:
 *                 type: boolean
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sharing rule updated
 *       400:
 *         description: Invalid input
 */
router.put(
  '/sharing-rules/:entityType',
  authenticateUser,
  HasPermission(['manage_security']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const entityType = req.params.entityType as string;
      const { defaultAccess, hierarchyAccess, description } = req.body;

      if (!defaultAccess || !Object.values(DefaultAccessLevel).includes(defaultAccess)) {
        res.status(400).json({
          message: `defaultAccess must be one of: ${Object.values(DefaultAccessLevel).join(', ')}`
        });
        return;
      }

      const rule = await setDefaultAccess(
        entityType,
        defaultAccess,
        hierarchyAccess !== undefined ? hierarchyAccess : true,
        description
      );
      wrapResult(res, rule);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/security/share:
 *   post:
 *     summary: Share a record with a user or role
 *     description: Grants access to a specific record to a user or role.
 *     tags: [Data Sharing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entityType
 *               - entityId
 *               - accessLevel
 *             properties:
 *               entityType:
 *                 type: string
 *               entityId:
 *                 type: string
 *               sharedWithUserId:
 *                 type: integer
 *               sharedWithRoleId:
 *                 type: string
 *                 format: uuid
 *               accessLevel:
 *                 type: string
 *                 enum: [READ, WRITE, FULL]
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Record shared
 *       400:
 *         description: Invalid input
 */
router.post(
  '/share',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { entityType, entityId, sharedWithUserId, sharedWithRoleId, accessLevel, expiresAt } = req.body;

      if (!entityType || !entityId) {
        res.status(400).json({ message: 'entityType and entityId are required' });
        return;
      }

      if (!accessLevel || !Object.values(ShareAccessLevel).includes(accessLevel)) {
        res.status(400).json({
          message: `accessLevel must be one of: ${Object.values(ShareAccessLevel).join(', ')}`
        });
        return;
      }

      if (!sharedWithUserId && !sharedWithRoleId) {
        res.status(400).json({ message: 'Either sharedWithUserId or sharedWithRoleId is required' });
        return;
      }

      const share = await shareRecord(
        entityType,
        entityId,
        { userId: sharedWithUserId, roleId: sharedWithRoleId },
        accessLevel,
        req.user.id,
        expiresAt ? new Date(expiresAt) : undefined
      );

      wrapResult(res, share);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/security/share/{id}:
 *   delete:
 *     summary: Revoke a record share
 *     description: Removes access to a shared record by share ID.
 *     tags: [Data Sharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Share revoked
 *       404:
 *         description: Share not found
 */
router.delete(
  '/share/:id',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const shareId = Number(req.params.id);
      await revokeShare(shareId);
      wrapResult(res, { message: 'Share revoked successfully' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/security/shares/{entityType}/{entityId}:
 *   get:
 *     summary: Get shares for a record
 *     description: Returns all active shares for a specific record.
 *     tags: [Data Sharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record shares returned
 */
router.get(
  '/shares/:entityType/:entityId',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const entityType = req.params.entityType as string;
      const entityId = req.params.entityId as string;
      const shares = await getRecordShares(entityType, entityId);
      wrapResult(res, shares);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
