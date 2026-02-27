import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import service from './socialCrmService';

class SocialCrmController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.create(req.body, (req.user as any)?.tenantId), 201); } catch (e) { next(e); }
  }
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.getAll(req.query, (req.user as any)?.tenantId)); } catch (e) { next(e); }
  }
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.update(Number(req.params.id), req.body)); } catch (e) { next(e); }
  }
  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { await service.delete(Number(req.params.id)); wrapResult(res, { deleted: true }); } catch (e) { next(e); }
  }
  // ── Social Posts ──────────────────────────────────────────────────────────
  async createPost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.createPost(req.body, (req.user as any)?.tenantId), 201); } catch (e) { next(e); }
  }
  async getPosts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.getPosts(req.query, (req.user as any)?.tenantId)); } catch (e) { next(e); }
  }
  async updatePost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.updatePost(Number(req.params.id), req.body)); } catch (e) { next(e); }
  }
  async deletePost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { await service.deletePost(Number(req.params.id)); wrapResult(res, { deleted: true }); } catch (e) { next(e); }
  }
}
export default new SocialCrmController();
