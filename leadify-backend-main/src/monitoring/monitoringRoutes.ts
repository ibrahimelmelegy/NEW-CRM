import express from 'express';
import monitoringController from './monitoringController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';

const router = express.Router();

// All monitoring routes require authentication and MANAGE_SETTINGS (admin) permission
router.use(authenticateUser, HasPermission(['MANAGE_SETTINGS']));

/**
 * @swagger
 * /api/monitoring/overview:
 *   get:
 *     summary: Get monitoring dashboard overview
 *     description: Returns combined system, database, Redis, and request metrics for the main dashboard view.
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Dashboard overview data
 */
router.get('/overview', monitoringController.getOverview);

/**
 * @swagger
 * /api/monitoring/system:
 *   get:
 *     summary: Get system metrics
 *     description: Returns CPU usage, memory usage, uptime, and Node.js version information.
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: System metrics data
 */
router.get('/system', monitoringController.getSystemMetrics);

/**
 * @swagger
 * /api/monitoring/database:
 *   get:
 *     summary: Get database metrics
 *     description: Returns database connection pool statistics and response time.
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Database metrics data
 */
router.get('/database', monitoringController.getDatabaseMetrics);

/**
 * @swagger
 * /api/monitoring/redis:
 *   get:
 *     summary: Get Redis metrics
 *     description: Returns Redis server memory usage, client count, and operations per second.
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Redis metrics data
 */
router.get('/redis', monitoringController.getRedisMetrics);

/**
 * @swagger
 * /api/monitoring/requests:
 *   get:
 *     summary: Get request metrics
 *     description: Returns request count, error rate, response times, and timeline data for the specified period.
 *     tags: [Monitoring]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1h, 6h, 24h]
 *         description: Time period to aggregate metrics for
 *         example: "1h"
 *     responses:
 *       200:
 *         description: Request metrics with timeline
 */
router.get('/requests', monitoringController.getRequestMetrics);

/**
 * @swagger
 * /api/monitoring/endpoints:
 *   get:
 *     summary: Get endpoint performance metrics
 *     description: Returns top endpoints by traffic volume with average and max response times.
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Endpoint metrics sorted by request count
 */
router.get('/endpoints', monitoringController.getEndpointMetrics);

/**
 * @swagger
 * /api/monitoring/errors:
 *   get:
 *     summary: Get error log
 *     description: Returns paginated list of tracked errors with stack traces and context.
 *     tags: [Monitoring]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *         example: 20
 *     responses:
 *       200:
 *         description: Paginated error log entries
 */
router.get('/errors', monitoringController.getErrorLog);

/**
 * @swagger
 * /api/monitoring/health-timeline:
 *   get:
 *     summary: Get health check timeline
 *     description: Returns historical health check results for API, database, and Redis.
 *     tags: [Monitoring]
 *     parameters:
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *         description: Number of hours to look back
 *         example: 24
 *     responses:
 *       200:
 *         description: Health timeline data
 */
router.get('/health-timeline', monitoringController.getHealthTimeline);

export default router;
