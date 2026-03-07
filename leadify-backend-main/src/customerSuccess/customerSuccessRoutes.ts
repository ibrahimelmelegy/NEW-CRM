import express from 'express';
import customerSuccessController from './customerSuccessController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Customer Success
 *   description: Customer success dashboard and client health scoring
 */

/**
 * @swagger
 * /api/customer-success/dashboard:
 *   get:
 *     summary: Get the customer success dashboard overview
 *     tags: [Customer Success]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard with health scores, at-risk clients, and metrics
 *       500:
 *         description: Server error
 */
router.get('/', authenticateUser, customerSuccessController.getDashboard);
// Dashboard overview
router.get('/dashboard', authenticateUser, customerSuccessController.getDashboard);

/**
 * @swagger
 * /api/customer-success/client/{id}/health:
 *   get:
 *     summary: Get the health score for a single client
 *     tags: [Customer Success]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     responses:
 *       200:
 *         description: Client health score and breakdown
 *       404:
 *         description: Client not found
 *       500:
 *         description: Server error
 */
// Single client health score
router.get('/client/:id/health', authenticateUser, customerSuccessController.getClientHealth);

export default router;
