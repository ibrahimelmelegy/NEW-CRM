import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import complianceService from './complianceService';

class ComplianceController {
  // ─── Consent Records ──────────────────────────────────────────────────────
  async createConsent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await complianceService.createConsent(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }

  async getAllConsents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await complianceService.getAllConsents(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async getConsentById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await complianceService.getConsentById(Number(req.params.id));
      if (!result) return wrapResult(res, { message: 'Consent record not found' }, 404);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async updateConsent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await complianceService.updateConsent(Number(req.params.id), req.body);
      if (!result) return wrapResult(res, { message: 'Consent record not found' }, 404);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async deleteConsent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await complianceService.deleteConsent(Number(req.params.id));
      if (!deleted) return wrapResult(res, { message: 'Consent record not found' }, 404);
      wrapResult(res, { deleted: true });
    } catch (e) { next(e); }
  }

  // ─── Data Requests ────────────────────────────────────────────────────────
  async createDataRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await complianceService.createDataRequest(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }

  async getAllDataRequests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await complianceService.getAllDataRequests(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async getDataRequestById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await complianceService.getDataRequestById(Number(req.params.id));
      if (!result) return wrapResult(res, { message: 'Data request not found' }, 404);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async processDataRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await complianceService.processDataRequest(Number(req.params.id), req.body);
      if (!result) return wrapResult(res, { message: 'Data request not found' }, 404);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  // ─── Audit & Score ────────────────────────────────────────────────────────
  async runAudit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await complianceService.runAudit(tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async getComplianceScore(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await complianceService.getComplianceScore(tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }
}

export default new ComplianceController();
