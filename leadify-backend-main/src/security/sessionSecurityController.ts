import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import sessionSecurityService from './sessionSecurityService';

class SessionSecurityController {
  // ─── Active Sessions ───────────────────────────────────────────────────

  public async getActiveSessions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const currentToken = req.header('Authorization')?.replace('Bearer ', '') || undefined;
      const sessions = await sessionSecurityService.getActiveSessions(userId, currentToken);
      wrapResult(res, sessions);
    } catch (error) {
      next(error);
    }
  }

  public async terminateSession(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const sessionId = parseInt(req.params.id as string, 10);
      await sessionSecurityService.terminateSession(sessionId, userId);
      wrapResult(res, { terminated: true });
    } catch (error) {
      next(error);
    }
  }

  public async terminateAllSessions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const currentToken = req.header('Authorization')?.replace('Bearer ', '') || undefined;
      const count = await sessionSecurityService.terminateAllSessions(userId, currentToken);
      wrapResult(res, { terminated: count });
    } catch (error) {
      next(error);
    }
  }

  // ─── Login History ─────────────────────────────────────────────────────

  public async getLoginHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const tenantId = req.headers['x-tenant-id'] as string | undefined;
      const filters = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        status: req.query.status as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined
      };
      const result = await sessionSecurityService.getLoginHistory(userId, tenantId, filters);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ─── IP Whitelist ──────────────────────────────────────────────────────

  public async getIPWhitelist(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string | undefined;
      const list = await sessionSecurityService.getIPWhitelist(tenantId);
      wrapResult(res, list);
    } catch (error) {
      next(error);
    }
  }

  public async addIPWhitelist(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const tenantId = req.headers['x-tenant-id'] as string | undefined;
      const { ip, label } = req.body;
      const entry = await sessionSecurityService.addIPWhitelist(ip, label, userId, tenantId);
      wrapResult(res, entry, 201);
    } catch (error) {
      next(error);
    }
  }

  public async removeIPWhitelist(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string | undefined;
      await sessionSecurityService.removeIPWhitelist(req.params.id as string, tenantId);
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  // ─── Security Dashboard ────────────────────────────────────────────────

  public async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string | undefined;
      const metrics = await sessionSecurityService.getSecurityDashboard(tenantId);
      wrapResult(res, metrics);
    } catch (error) {
      next(error);
    }
  }

  // ─── GDPR Data Export ──────────────────────────────────────────────────

  public async exportData(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const tenantId = req.headers['x-tenant-id'] as string | undefined;
      const data = await sessionSecurityService.exportUserData(userId, tenantId);
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }
}

export default new SessionSecurityController();
