import { Router } from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import slaController from './slaController';

const router = Router();

// ────── SLA Policies ──────

/**
 * @swagger
 * /api/sla/policies:
 *   get:
 *     summary: List SLA policies
 *     tags: [SLA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *         description: Filter by entity type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Paginated list of SLA policies
 */
router.get('/', authenticateUser, slaController.getPolicies);
router.get('/policies', authenticateUser, slaController.getPolicies);

/**
 * @swagger
 * /api/sla/policies:
 *   post:
 *     summary: Create a new SLA policy
 *     tags: [SLA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - entityType
 *               - responseTimeMinutes
 *               - resolutionTimeMinutes
 *             properties:
 *               name:
 *                 type: string
 *               entityType:
 *                 type: string
 *                 enum: [ticket, task, approval_request, lead, deal]
 *               conditions:
 *                 type: object
 *               responseTimeMinutes:
 *                 type: integer
 *               resolutionTimeMinutes:
 *                 type: integer
 *               escalationRules:
 *                 type: array
 *               businessHoursOnly:
 *                 type: boolean
 *               businessHours:
 *                 type: object
 *     responses:
 *       201:
 *         description: SLA policy created
 */
router.post('/policies', authenticateUser, slaController.createPolicy);

/**
 * @swagger
 * /api/sla/policies/{id}:
 *   put:
 *     summary: Update an SLA policy
 *     tags: [SLA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: SLA policy updated
 *       654:
 *         description: Not found
 */
router.put('/policies/:id', authenticateUser, slaController.updatePolicy);

/**
 * @swagger
 * /api/sla/policies/{id}:
 *   delete:
 *     summary: Delete an SLA policy
 *     tags: [SLA]
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
 *         description: SLA policy deleted
 *       654:
 *         description: Not found
 */
router.delete('/policies/:id', authenticateUser, slaController.deletePolicy);

// ────── SLA Status & Metrics ──────

/**
 * @swagger
 * /api/sla/status/{entityType}/{entityId}:
 *   get:
 *     summary: Get SLA status for a specific entity
 *     tags: [SLA]
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
 *         description: SLA status with time remaining
 */
router.get('/status/:entityType/:entityId', authenticateUser, slaController.getSLAStatus);

/**
 * @swagger
 * /api/sla/metrics/{entityType}:
 *   get:
 *     summary: Get aggregate SLA metrics for an entity type
 *     tags: [SLA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for metrics range
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for metrics range
 *     responses:
 *       200:
 *         description: SLA metrics
 */
router.get('/metrics/:entityType', authenticateUser, slaController.getSLAMetrics);

// ────── SLA Actions ──────

/**
 * @swagger
 * /api/sla/check-breaches:
 *   post:
 *     summary: Manually trigger SLA breach check and escalations
 *     tags: [SLA]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Breach check results
 */
router.post('/check-breaches', authenticateUser, slaController.checkBreaches);

/**
 * @swagger
 * /api/sla/{entityType}/{entityId}/pause:
 *   patch:
 *     summary: Pause SLA timer for an entity
 *     tags: [SLA]
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
 *         description: SLA paused
 */
router.patch('/:entityType/:entityId/pause', authenticateUser, slaController.pauseSLA);

/**
 * @swagger
 * /api/sla/{entityType}/{entityId}/resume:
 *   patch:
 *     summary: Resume paused SLA timer for an entity
 *     tags: [SLA]
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
 *         description: SLA resumed
 */
router.patch('/:entityType/:entityId/resume', authenticateUser, slaController.resumeSLA);

export default router;
