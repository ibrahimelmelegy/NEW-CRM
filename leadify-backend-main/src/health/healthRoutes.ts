import { Router, Request, Response } from 'express';
import { sequelize } from '../config/db';

const router = Router();

// Basic health check — always responds (for load balancer)
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Deep health check — tests database connectivity
router.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    await sequelize.authenticate();
    const [results]: any = await sequelize.query('SELECT 1+1 AS result');

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
  } catch (error: any) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: 'error', message: error.message },
      },
    });
  }
});

// Liveness probe (Kubernetes-style)
router.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

export default router;
