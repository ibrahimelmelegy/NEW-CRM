import express, { Response } from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import { getActivityLogs } from './activityService';
import { wrapResult } from '../utils/response/responseWrapper';
import { NextFunction } from 'express-serve-static-core';
import { AuthenticatedRequest } from '../types';

/**
 * @swagger
 * tags:
 *   name: Activity
 *   description: Activity logs — track changes across all CRM entities
 */

const router = express.Router();

/**
 * @swagger
 * /api/activity:
 *   get:
 *     summary: Get all recent activity logs
 *     description: Returns the most recent activity logs across all models
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: List of recent activity logs
 *       500:
 *         description: Server error
 */
router.get('/', authenticateUser, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = Number(req.query.limit) || 100;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getAllActivityLogs } = require('./activityService');
    const logs = await getAllActivityLogs(limit);
    wrapResult(res, logs);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/activity/{model}/{id}:
 *   get:
 *     summary: Get activity logs for a specific entity
 *     description: Returns paginated activity logs for a given model and entity ID
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: model
 *         required: true
 *         schema:
 *           type: string
 *         description: Entity model name (e.g. lead, deal, contact)
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Entity ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated activity logs for the entity
 *       404:
 *         description: Entity not found
 *       500:
 *         description: Server error
 */
router.get('/:model/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const responseFromService = await getActivityLogs(
      req.params?.model as unknown,
      req.params?.id as string,
      req.query?.page as unknown,
      req.query?.limit as unknown
    );
    wrapResult(res, responseFromService);
  } catch (error) {
    next(error);
  }
});

export default router;
