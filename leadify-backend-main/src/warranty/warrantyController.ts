import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import service from './warrantyService';

class WarrantyController {
  async createWarranty(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.createWarranty(req.body, req.user!.tenantId!), 201);
    } catch (e) {
      next(e);
    }
  }
  async getWarranties(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.getWarranties(req.query, req.user!.tenantId!));
    } catch (e) {
      next(e);
    }
  }
  async updateWarranty(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.updateWarranty(Number(req.params.id), req.body));
    } catch (e) {
      next(e);
    }
  }
  async deleteWarranty(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await service.deleteWarranty(Number(req.params.id));
      wrapResult(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }
  async createClaim(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.createClaim(req.body, req.user!.tenantId!), 201);
    } catch (e) {
      next(e);
    }
  }
  async getClaims(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.getClaims(req.query, req.user!.tenantId!));
    } catch (e) {
      next(e);
    }
  }
  async updateClaim(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.updateClaim(Number(req.params.id), req.body));
    } catch (e) {
      next(e);
    }
  }

  // ─── New Business Logic Endpoints ────────────────────────────────────────────

  async checkCoverage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const warrantyId = Number(req.params.id);
      const claimDate = req.query.claimDate as string | undefined;
      wrapResult(res, await service.checkWarrantyCoverage(warrantyId, claimDate));
    } catch (e) {
      next(e);
    }
  }

  async createClaimWithValidation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.createClaimWithValidation(req.body, req.user!.tenantId!), 201);
    } catch (e) {
      if (e instanceof Error && (e as Error & { statusCode?: number }).statusCode === 400) {
        return res.status(400).send({ success: false, message: e.message, coverage: (e as Record<string, unknown>).coverage });
      }
      next(e);
    }
  }

  async getExpiringWarranties(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const daysAhead = req.query.daysAhead ? Number(req.query.daysAhead) : 30;
      wrapResult(res, await service.getExpiringWarranties(tenantId, daysAhead));
    } catch (e) {
      next(e);
    }
  }

  async getWarrantyAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      wrapResult(res, await service.getWarrantyAnalytics(tenantId));
    } catch (e) {
      next(e);
    }
  }

  async extendWarranty(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const { extensionDays, reason, upgradeType } = req.body;
      if (!extensionDays || extensionDays <= 0) {
        return res.status(400).send({ success: false, message: 'extensionDays must be a positive number' });
      }
      wrapResult(res, await service.extendWarranty(id, { extensionDays, reason, upgradeType }));
    } catch (e) {
      next(e);
    }
  }

  async expireOverdue(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      wrapResult(res, await service.expireOverdueWarranties(tenantId));
    } catch (e) {
      next(e);
    }
  }
}
export default new WarrantyController();
