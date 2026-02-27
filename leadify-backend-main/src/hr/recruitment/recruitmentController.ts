import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { wrapResult } from '../../utils/response/responseWrapper';
import recruitmentService from './recruitmentService';

class RecruitmentController {
  // ──────────── Job Postings CRUD ────────────
  async createPosting(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await recruitmentService.createPosting(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }

  async getPostings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await recruitmentService.getPostings(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async updatePosting(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await recruitmentService.updatePosting(Number(req.params.id), req.body);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async deletePosting(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await recruitmentService.deletePosting(Number(req.params.id));
      wrapResult(res, { deleted: true });
    } catch (e) { next(e); }
  }

  // ──────────── Applicants CRUD ────────────
  async createApplicant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await recruitmentService.createApplicant(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }

  async getApplicants(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await recruitmentService.getApplicants(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async updateApplicant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await recruitmentService.updateApplicant(Number(req.params.id), req.body);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async deleteApplicant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await recruitmentService.deleteApplicant(Number(req.params.id));
      wrapResult(res, { deleted: true });
    } catch (e) { next(e); }
  }

  // ──────────── Business Logic Endpoints ────────────
  async moveApplicantStage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await recruitmentService.moveApplicantStage(
        Number(req.params.id),
        req.body.stage
      );
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async checkDuplicate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const existing = await recruitmentService.checkDuplicateApplicant(
        req.query.email as string,
        Number(req.query.jobPostingId)
      );
      wrapResult(res, { isDuplicate: !!existing, existingApplicant: existing });
    } catch (e) { next(e); }
  }

  async getRecruitmentFunnel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await recruitmentService.getRecruitmentFunnel(Number(req.params.postingId));
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async getTimeToHire(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await recruitmentService.getTimeToHire(tenantId, {
        from: req.query.from as string,
        to: req.query.to as string
      });
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async closePosting(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const rejectRemaining = req.body.rejectRemaining !== false;
      const result = await recruitmentService.closePosting(Number(req.params.id), rejectRemaining);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async getPostingAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await recruitmentService.getPostingAnalytics(Number(req.params.postingId));
      wrapResult(res, result);
    } catch (e) { next(e); }
  }
}

export default new RecruitmentController();
