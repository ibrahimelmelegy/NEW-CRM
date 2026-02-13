import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import campaignService from './campaignService';
import { AuthenticatedRequest } from '../types';

class CampaignController {
  async getCampaigns(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await campaignService.getCampaigns(req.user!.id)); }
    catch (error) { next(error); }
  }

  async getCampaignById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await campaignService.getCampaignById(req.params.id as string, req.user!.id)); }
    catch (error) { next(error); }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await campaignService.create(req.user!.id, req.body), 201); }
    catch (error) { next(error); }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await campaignService.update(req.params.id as string, req.user!.id, req.body)); }
    catch (error) { next(error); }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { await campaignService.delete(req.params.id as string, req.user!.id); wrapResult(res, { deleted: true }); }
    catch (error) { next(error); }
  }

  async send(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await campaignService.sendCampaign(req.params.id as string, req.user!.id)); }
    catch (error) { next(error); }
  }

  async getAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await campaignService.getAnalytics(req.params.id as string, req.user!.id)); }
    catch (error) { next(error); }
  }

  async getTemplates(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await campaignService.getTemplates(req.user!.id)); }
    catch (error) { next(error); }
  }

  async createTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await campaignService.createTemplate(req.user!.id, req.body), 201); }
    catch (error) { next(error); }
  }

  async deleteTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { await campaignService.deleteTemplate(req.params.id as string, req.user!.id); wrapResult(res, { deleted: true }); }
    catch (error) { next(error); }
  }
}

export default new CampaignController();
