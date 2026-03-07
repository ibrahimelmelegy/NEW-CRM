import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import proposalFinanceTableItemService from './proposalFinanceTableItemService';
import User from '../user/userModel';
import { AuthenticatedRequest } from '../types';

class ProposalFinanceTableItemController {
  public async createProposalFinanceTableItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await proposalFinanceTableItemService.createProposalFinanceTableItem(req.body, req.user as User);
      wrapResult(res, responseFromService, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateProposalFinanceTableItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await proposalFinanceTableItemService.updateProposalFinanceTableItem(
        req.params.id as string,
        req.body,
        req.user as User
      );
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async getProposalFinanceTableItems(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await proposalFinanceTableItemService.getProposalFinanceTableItems(req.query);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async proposalFinanceTableItemById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await proposalFinanceTableItemService.proposalFinanceTableItemById(req.params.id as string);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async deleteProposalFinanceTableItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await proposalFinanceTableItemService.deleteProposalFinanceTableItem(req.params.id as string, req.user as User);
      wrapResult(res);
    } catch (error) {
      next(error);
    }
  }
}

export default new ProposalFinanceTableItemController();
