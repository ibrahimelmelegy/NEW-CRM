import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import dealService from './dealService';
import User from '../user/userModel';
import { io } from '../server';

class DealController {
  public async convertLead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await dealService.convertLeadTODeal(req.body, req.user as User);
      io.emit('deal:created', { id: responseFromService?.id });
      wrapResult(res, responseFromService, 201);
    } catch (error) {
      next(error);
    }
  }

  public async createDeal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await dealService.createDeal(req.body, req.user as User);
      io.emit('deal:created', { id: responseFromService?.id });
      wrapResult(res, responseFromService, 201);
    } catch (error) {
      next(error);
    }
  }

  public async createDealDelivery(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await dealService.createDealDeliveryDetails(req.body.dealId, req.body.deliveryDetails);
      wrapResult(res, responseFromService, 201);
    } catch (error) {
      next(error);
    }
  }

  public async createDealInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await dealService.createDealInvoice(req.body.dealId, req.body.invoiceDetails);
      wrapResult(res, responseFromService, 201);
    } catch (error) {
      next(error);
    }
  }

  public async getDeals(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await dealService.getDeals(req.query, req.user as User);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }
  public async assignUserToDeal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await dealService.assignUserToDeal(req.body, req.user as User);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async updateDeal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await dealService.updateDeal(req.body, req.user as User);
      io.emit('deal:updated', { id: req.body?.dealId });
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async getKanbanDeals(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await dealService.getKanbanDeals(req.user as User);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async updateDealStage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await dealService.updateDealStage(req.body.dealId, req.body.stage, req.user as User);
      io.emit('deal:stageChanged', { id: responseFromService.id, stage: responseFromService.stage });
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async getDealById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await dealService.getDealById(req.params.id as string, req.user as User);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async sendDealsExcelByEmail(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await dealService.sendDealsExcelByEmail(req.query, req.user as User, req.params.email as string);
      wrapResult(res);
    } catch (error) {
      next(error);
    }
  }

  public async getWeightedPipeline(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req.user as User).tenantId || undefined;
      const responseFromService = await dealService.getWeightedPipeline(tenantId);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async getStaleDealAlerts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req.user as User).tenantId || undefined;
      const staleDays = req.query.staleDays ? Number(req.query.staleDays) : 14;
      const responseFromService = await dealService.getStaleDealAlerts(tenantId, staleDays);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async getWinLossAnalysis(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req.user as User).tenantId || undefined;
      const period = {
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined
      };
      const responseFromService = await dealService.getWinLossAnalysis(tenantId, period);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }
}

export default new DealController();
