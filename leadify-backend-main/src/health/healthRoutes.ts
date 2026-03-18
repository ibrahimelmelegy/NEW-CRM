import { Router, Request, Response } from 'express';
import { sequelize } from '../config/db';
import redisClient from '../config/redis';

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
    version: process.env.npm_package_version || '1.0.0'
  });
});

/**
 * @swagger
 * /api/health/ready:
 *   get:
 *     summary: Deep health check (database + Redis connectivity)
 *     description: Tests database and Redis connectivity. Used for readiness probes.
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
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 details:
 *                   type: object
 *                   properties:
 *                     db:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: connected
 *                     redis:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: connected
 *                     memory:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: ok
 *                         message:
 *                           type: string
 *                           example: 128MB / 256MB
 *       503:
 *         description: Service unavailable (database or Redis connection failed)
 */
router.get('/health/ready', async (_req: Request, res: Response) => {
  const timestamp = new Date().toISOString();
  const details: Record<string, { status: string; message?: string }> = {};
  let healthy = true;

  // ── Database check ──────────────────────────────────────────────────────
  try {
    await sequelize.authenticate();
    details.db = { status: 'connected' };
  } catch (error) {
    healthy = false;
    details.db = { status: 'disconnected', message: (error as Error).message };
  }

  // ── Redis check ─────────────────────────────────────────────────────────
  try {
    if (redisClient.isOpen) {
      await redisClient.ping();
      details.redis = { status: 'connected' };
    } else {
      healthy = false;
      details.redis = { status: 'disconnected', message: 'Redis client is not connected' };
    }
  } catch (error) {
    healthy = false;
    details.redis = { status: 'disconnected', message: (error as Error).message };
  }

  // ── Memory info ─────────────────────────────────────────────────────────
  const mem = process.memoryUsage();
  details.memory = {
    status: 'ok',
    message: `${Math.round(mem.heapUsed / 1024 / 1024)}MB / ${Math.round(mem.heapTotal / 1024 / 1024)}MB`
  };

  const statusCode = healthy ? 200 : 503;
  res.status(statusCode).json({
    status: healthy ? 'ok' : 'error',
    timestamp,
    uptime: process.uptime(),
    details
  });
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
