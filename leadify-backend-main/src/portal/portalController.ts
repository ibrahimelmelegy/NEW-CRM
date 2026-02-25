import { Request, Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import portalService from './portalService';
import { PortalRequest } from './portalMiddleware';
import { AuthenticatedRequest } from '../types';

class PortalController {
  // Public: auth
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      wrapResult(res, await portalService.login(email, password));
    } catch (error) {
      next(error);
    }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await portalService.register(req.body), 201);
    } catch (error) {
      next(error);
    }
  }

  // Portal user: profile
  async getProfile(req: PortalRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, req.portalUser);
    } catch (error) {
      next(error);
    }
  }

  // Portal user: dashboard
  async getDashboard(req: PortalRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await portalService.getDashboard(req.portalUser!.clientId));
    } catch (error) {
      next(error);
    }
  }

  // Portal user: deals
  async getDeals(req: PortalRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await portalService.getDeals(req.portalUser!.clientId));
    } catch (error) {
      next(error);
    }
  }

  // Portal user: invoices
  async getInvoices(req: PortalRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await portalService.getInvoices(req.portalUser!.clientId));
    } catch (error) {
      next(error);
    }
  }

  // Portal user: contracts
  async getContracts(req: PortalRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await portalService.getContracts(req.portalUser!.clientId));
    } catch (error) {
      next(error);
    }
  }

  // Portal user: tickets
  async getTickets(req: PortalRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await portalService.getTickets(req.portalUser!.id));
    } catch (error) {
      next(error);
    }
  }

  async createTicket(req: PortalRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await portalService.createTicket(req.portalUser!.id, req.body), 201);
    } catch (error) {
      next(error);
    }
  }

  async getTicketById(req: PortalRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await portalService.getTicketById(req.params.id as string, req.portalUser!.id));
    } catch (error) {
      next(error);
    }
  }

  // Admin endpoints
  async adminGetPortalUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await portalService.getPortalUsers());
    } catch (error) {
      next(error);
    }
  }

  async adminCreatePortalUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await portalService.createPortalUser(req.body), 201);
    } catch (error) {
      next(error);
    }
  }

  async adminTogglePortalUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await portalService.togglePortalUser(req.params.id as string, req.body.isActive));
    } catch (error) {
      next(error);
    }
  }

  async adminGetAllTickets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await portalService.getAllTickets());
    } catch (error) {
      next(error);
    }
  }

  async adminRespondToTicket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await portalService.respondToTicket(req.params.id as string, req.body.response, req.body.status));
    } catch (error) {
      next(error);
    }
  }
}

export default new PortalController();
