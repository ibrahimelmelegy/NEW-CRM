import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import monitoringService from './monitoringService';
import { AuthenticatedRequest } from '../types';

class MonitoringController {
  /**
   * GET /api/monitoring/overview
   * Main dashboard data - combined overview
   */
  public async getOverview(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await monitoringService.getOverview();
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/monitoring/system
   * System metrics (CPU, memory, uptime, Node.js info)
   */
  public async getSystemMetrics(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await monitoringService.getSystemMetrics();
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/monitoring/database
   * Database connection pool stats
   */
  public async getDatabaseMetrics(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await monitoringService.getDatabaseMetrics();
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/monitoring/redis
   * Redis server metrics
   */
  public async getRedisMetrics(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await monitoringService.getRedisMetrics();
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/monitoring/requests?period=1h|6h|24h
   * Request metrics with timeline
   */
  public async getRequestMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const period = (req.query.period as string) || '1h';
      const data = await monitoringService.getRequestMetrics(period);
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/monitoring/endpoints
   * Endpoint-level performance data
   */
  public async getEndpointMetrics(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await monitoringService.getEndpointMetrics();
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/monitoring/errors?page=1&limit=20
   * Error log with pagination
   */
  public async getErrorLog(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const data = await monitoringService.getErrorLog(page, limit);
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/monitoring/health-timeline?hours=24
   * Health check results over time
   */
  public async getHealthTimeline(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const data = await monitoringService.getHealthTimeline(hours);
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }
}

export default new MonitoringController();
