import express, { Response, NextFunction } from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import { wrapResult } from '../utils/response/responseWrapper';
import { AuthenticatedRequest } from '../types';
import {
  getAuditTrail,
  getFieldHistory,
  getUserAuditLog,
  getAllAuditLogs,
  AuditLogFilters
} from './auditService';
import { AuditAction } from './auditModel';

const router = express.Router();

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: Get all audit logs with filters (admin)
 *     tags: [Audit]
 *     parameters:
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE, STATUS_CHANGE, ASSIGNMENT, RESTORE, ARCHIVE]
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated audit logs
 */
router.get(
  '/',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters: AuditLogFilters = {
        entityType: req.query.entityType as string | undefined,
        userId: req.query.userId ? Number(req.query.userId) : undefined,
        action: req.query.action as AuditAction | undefined,
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20
      };

      const result = await getAllAuditLogs(filters);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/audit/user/{userId}:
 *   get:
 *     summary: Get audit log for a specific user
 *     tags: [Audit]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated user audit log
 */
router.get(
  '/user/:userId',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = Number(req.params.userId);
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      const result = await getUserAuditLog(userId, page, limit);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/audit/{entityType}/{entityId}/field/{fieldName}:
 *   get:
 *     summary: Get change history for a specific field on an entity
 *     tags: [Audit]
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
 *       - in: path
 *         name: fieldName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Field change history
 */
router.get(
  '/:entityType/:entityId/field/:fieldName',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const entityType = req.params.entityType as string;
      const entityId = req.params.entityId as string;
      const fieldName = req.params.fieldName as string;
      const result = await getFieldHistory(entityType, entityId, fieldName);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/audit/{entityType}/{entityId}:
 *   get:
 *     summary: Get audit trail for a specific entity
 *     tags: [Audit]
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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated audit trail
 */
router.get(
  '/:entityType/:entityId',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const entityType = req.params.entityType as string;
      const entityId = req.params.entityId as string;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      const result = await getAuditTrail(entityType, entityId, page, limit);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
