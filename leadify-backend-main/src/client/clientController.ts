import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import ClientService from './clientService';
import { CreateClientInput } from './inputs/createClientInput';
import User from '../user/userModel';

class ClientController {
  public async createClient(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as CreateClientInput;
      if (!body.users?.length) {
        body.users = [req.user!.id];
      }
      const responseFromService = await ClientService.createClient(body, req.user as User);
      wrapResult(res, responseFromService, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateClient(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await ClientService.updateClient(req.params.id as string, req.body, req.user as User);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async getClients(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await ClientService.getClients(req.query, req.user as User);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async ClientById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await ClientService.clientById(req.params.id as string, req.user as User);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async clients(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await ClientService.getClientsArray();
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async getClientContacts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await ClientService.getClientContacts(req.params.id as string, req.user as User);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async sendClientsExcelByEmail(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await ClientService.sendClientsExcelByEmail(req.query, req.user as User, req.params.email as string);
      wrapResult(res);
    } catch (error) {
      next(error);
    }
  }

  public async getHealthScore(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await ClientService.calculateHealthScore(req.params.id as string);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async segmentClients(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req.user as User).tenantId || undefined;
      const responseFromService = await ClientService.segmentClients(tenantId);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async getClientAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req.user as User).tenantId || undefined;
      const responseFromService = await ClientService.getClientAnalytics(tenantId);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async getCompanyHierarchy(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await ClientService.getCompanyHierarchy(req.params.id as string);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async getCompanyTimeline(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedLimit = parseInt(req.query.limit as string, 10);
      const limit = !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 50;
      const responseFromService = await ClientService.getCompanyTimeline(req.params.id as string, limit);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async getCompanyRevenue(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await ClientService.getCompanyRevenue(req.params.id as string);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async createCompanyNote(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { content, attachments } = req.body;
      const responseFromService = await ClientService.createCompanyNote(req.params.id as string, content, req.user!.id, attachments);
      wrapResult(res, responseFromService, 201);
    } catch (error) {
      next(error);
    }
  }

  public async getCompanyNotes(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await ClientService.getCompanyNotes(req.params.id as string);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async updateCompanyNote(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await ClientService.updateCompanyNote(req.params.noteId as string, req.body);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async deleteCompanyNote(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await ClientService.deleteCompanyNote(req.params.noteId as string);
      wrapResult(res);
    } catch (error) {
      next(error);
    }
  }

  public async deleteClient(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await ClientService.deleteClient(req.params.id as string, req.user as User);
      wrapResult(res);
    } catch (error) {
      next(error);
    }
  }

  public async bulkUpdateCompanies(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyIds, updates } = req.body;
      const responseFromService = await ClientService.bulkUpdateCompanies(companyIds, updates, req.user as User);
      wrapResult(res, { updatedCount: responseFromService });
    } catch (error) {
      next(error);
    }
  }

  public async mergeCompanies(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sourceId, targetId } = req.body;
      const responseFromService = await ClientService.mergeCompanies(sourceId, targetId, req.user as User);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }
}

export default new ClientController();
