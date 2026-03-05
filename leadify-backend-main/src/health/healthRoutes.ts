import { Router, Request, Response } from 'express';
import { sequelize } from '../config/db';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Basic health check
 *     description: Returns service status, uptime, and version. Used by load balancers.
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 12345.67
 *                 version:
 *                   type: string
 *                   example: 2.0.0
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

/**
 * @swagger
 * /api/health/ready:
 *   get:
 *     summary: Deep health check (database connectivity)
 *     description: Tests database connectivity and reports memory usage. Used for readiness probes.
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: All systems ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 checks:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: ok
 *                     memory:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: ok
 *                         usage:
 *                           type: string
 *                           example: 128MB
 *       503:
 *         description: Service unavailable (database connection failed)
 */
router.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    await sequelize.authenticate();
    const [results]: unknown = await sequelize.query('SELECT 1+1 AS result');

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: { status: 'ok', responseTime: 'fast' },
        memory: {
          status: 'ok',
          usage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
        },
      },
    });
  } catch (error: unknown) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: 'error', message: error.message },
      },
    });
  }
});

/**
 * @swagger
 * /api/health/live:
 *   get:
 *     summary: Liveness probe
 *     description: Simple liveness check for Kubernetes-style orchestrators.
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: alive
 */
router.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

export default router;
