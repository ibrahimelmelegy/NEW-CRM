import { Request, Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import portalService from './portalService';
import { PortalRequest } from './portalMiddleware';
import { AuthenticatedRequest } from '../types';

class PortalController {
  // ─── Public: auth ──────────────────────────────────────────────────────────
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

  // ─── Magic Link Access ─────────────────────────────────────────────────────

  /**
   * POST /api/portal/request-access
   * Client enters email to receive a portal magic link
   */
  async requestAccess(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ success: false, message: 'Email is required' });
        return;
      }
      const result = await portalService.requestPortalAccess(email);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/portal/verify
   * Validate a portal token and return client data
   */
  async verifyToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      if (!token) {
        res.status(400).json({ success: false, message: 'Token is required' });
        return;
      }
      const result = await portalService.validatePortalToken(token);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ─── Portal user: profile ──────────────────────────────────────────────────
  async getProfile(req: PortalRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, req.portalUser);
    } catch (error) {
      next(error);
    }
  }

  // ─── Portal user: dashboard ────────────────────────────────────────────────
  async getDashboard(req: PortalRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await portalService.getDashboard(req.portalUser!.clientId));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/portal/dashboard/stats
   * Summary stats: outstanding invoices, open tickets, active projects
   */
  async getDashboardStats(req: PortalRequest, res: Response, next: NextFunction) {
    try {
      const result = await portalService.getClientDashboard(req.portalUser!.clientId);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ─── Portal user: deals ────────────────────────────────────────────────────
  async getDeals(req: PortalRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await portalService.getDeals(req.portalUser!.clientId));
    } catch (error) {
      next(error);
    }
  }

  // ─── Portal user: invoices ─────────────────────────────────────────────────
  async getInvoices(req: PortalRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await portalService.getInvoices(req.portalUser!.clientId));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/portal/invoices/:id/pdf
   * Generate and return invoice PDF data
   */
  async getInvoicePdf(req: PortalRequest, res: Response, next: NextFunction) {
    try {
      const invoiceId = parseInt(req.params.id as string, 10);
      if (isNaN(invoiceId)) {
        res.status(400).json({ success: false, message: 'Invalid invoice ID' });
        return;
      }
      const invoice = await portalService.getInvoiceForPdf(invoiceId, req.portalUser!.clientId);

      // Return invoice data for client-side PDF generation
      const invoiceData = {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: Number(invoice.amount),
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        collected: invoice.collected,
        collectedDate: invoice.collectedDate,
        deal: (invoice as unknown as Record<string, any>).deal || null
      };

      wrapResult(res, invoiceData);
    } catch (error) {
      next(error);
    }
  }

  // ─── Portal user: contracts ────────────────────────────────────────────────
  async getContracts(req: PortalRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await portalService.getContracts(req.portalUser!.clientId));
    } catch (error) {
      next(error);
    }
  }

  // ─── Portal user: tickets ──────────────────────────────────────────────────
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

  /**
   * GET /api/portal/tickets/:id/messages
   * Get ticket thread with all messages
   */
  async getTicketMessages(req: PortalRequest, res: Response, next: NextFunction) {
    try {
      const result = await portalService.getTicketWithMessages(req.params.id as string, req.portalUser!.id);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/portal/tickets/:id/messages
   * Add a message reply to a ticket
   */
  async addTicketMessage(req: PortalRequest, res: Response, next: NextFunction) {
    try {
      const { message } = req.body;
      if (!message || !message.trim()) {
        res.status(400).json({ success: false, message: 'Message is required' });
        return;
      }
      const result = await portalService.addTicketMessageFromPortal(req.portalUser!.id, req.params.id as string, message.trim());
      wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  // ─── Portal user: projects ─────────────────────────────────────────────────
  async getProjects(req: PortalRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await portalService.getClientProjects(req.portalUser!.clientId));
    } catch (error) {
      next(error);
    }
  }

  // ─── Admin endpoints ──────────────────────────────────────────────────────
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

  /**
   * POST /api/portal/admin/generate-access
   * Admin generates a portal access link for a client
   */
  async adminGenerateAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { clientId, email } = req.body;
      if (!clientId || !email) {
        res.status(400).json({ success: false, message: 'clientId and email are required' });
        return;
      }
      const result = await portalService.generatePortalAccess(clientId, email);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new PortalController();
