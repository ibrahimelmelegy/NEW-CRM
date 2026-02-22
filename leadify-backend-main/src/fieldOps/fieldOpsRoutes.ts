import express from 'express';
import fieldOpsController from './fieldOpsController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Field Operations
 *   description: Field check-in/check-out tracking and team location management
 */

/**
 * @swagger
 * /api/field-ops:
 *   get:
 *     summary: Get all check-ins
 *     tags: [Field Operations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [CHECK_IN, CHECK_OUT]
 *         description: Filter by check-in type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter end date
 *     responses:
 *       200:
 *         description: Paginated list of check-ins
 */
router.get('/', authenticateUser, fieldOpsController.getCheckIns);

/**
 * @swagger
 * /api/field-ops:
 *   post:
 *     summary: Create a new check-in or check-out
 *     tags: [Field Operations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *               - type
 *             properties:
 *               latitude:
 *                 type: number
 *                 format: double
 *                 description: GPS latitude
 *               longitude:
 *                 type: number
 *                 format: double
 *                 description: GPS longitude
 *               address:
 *                 type: string
 *                 description: Human-readable address
 *               type:
 *                 type: string
 *                 enum: [CHECK_IN, CHECK_OUT]
 *                 description: Type of field operation
 *               notes:
 *                 type: string
 *                 description: Optional notes
 *               photoUrl:
 *                 type: string
 *                 description: URL of attached photo
 *     responses:
 *       201:
 *         description: Check-in created
 */
router.post('/', authenticateUser, fieldOpsController.createCheckIn);

/**
 * @swagger
 * /api/field-ops/my-history:
 *   get:
 *     summary: Get current user's check-in history
 *     tags: [Field Operations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's check-ins (last 50)
 */
router.get('/my-history', authenticateUser, fieldOpsController.getUserHistory);

/**
 * @swagger
 * /api/field-ops/team-locations:
 *   get:
 *     summary: Get latest location for each team member
 *     tags: [Field Operations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Latest check-in per user
 */
router.get('/team-locations', authenticateUser, fieldOpsController.getTeamLocations);

export default router;
