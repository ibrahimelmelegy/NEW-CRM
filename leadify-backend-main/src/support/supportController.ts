import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import supportService from './supportService';
import { io } from '../server';

class SupportController {
  // ─── Tickets ──────────────────────────────────────────────────────────
  public async createTicket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = { ...req.body, tenantId: (req.user as any)?.tenantId };
      const ticket = await supportService.createTicket(data);
      io.emit('ticket:created', { id: ticket.id, ticketNumber: ticket.ticketNumber });
      wrapResult(res, ticket, 201);
    } catch (error) {
      next(error);
    }
  }

  public async getTickets(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await supportService.getTickets(req.query);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getTicketById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await supportService.getTicketById(req.params.id as string);
      wrapResult(res, ticket);
    } catch (error) {
      next(error);
    }
  }

  // ─── Messages ─────────────────────────────────────────────────────────
  public async addMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = {
        ...req.body,
        senderId: req.body.senderId || (req.user as any)?.id
      };
      const message = await supportService.addMessage(req.params.id as string, data);
      io.emit('ticket:message', { ticketId: req.params.id as string, messageId: message.id });
      wrapResult(res, message, 201);
    } catch (error) {
      next(error);
    }
  }

  // ─── Assignment ───────────────────────────────────────────────────────
  public async assignTicket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.body;
      const ticket = await supportService.assignTicket(req.params.id as string, userId);
      io.emit('ticket:assigned', { ticketId: ticket.id, assignedTo: userId });
      wrapResult(res, ticket);
    } catch (error) {
      next(error);
    }
  }

  // ─── Resolve & Close ──────────────────────────────────────────────────
  public async resolveTicket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await supportService.resolveTicket(req.params.id as string);
      io.emit('ticket:resolved', { ticketId: ticket.id });
      wrapResult(res, ticket);
    } catch (error) {
      next(error);
    }
  }

  public async closeTicket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await supportService.closeTicket(req.params.id as string);
      io.emit('ticket:closed', { ticketId: ticket.id });
      wrapResult(res, ticket);
    } catch (error) {
      next(error);
    }
  }

  // ─── CSAT ─────────────────────────────────────────────────────────────
  public async submitCSAT(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rating, comment } = req.body;
      const ticket = await supportService.submitCSAT(req.params.id as string, rating, comment);
      wrapResult(res, ticket);
    } catch (error) {
      next(error);
    }
  }

  // ─── Dashboard / Metrics ──────────────────────────────────────────────
  public async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await supportService.getTicketMetrics();
      wrapResult(res, metrics);
    } catch (error) {
      next(error);
    }
  }

  // ─── Canned Responses ─────────────────────────────────────────────────
  public async getCannedResponses(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responses = await supportService.getCannedResponses(req.query);
      wrapResult(res, responses);
    } catch (error) {
      next(error);
    }
  }

  public async createCannedResponse(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = { ...req.body, tenantId: (req.user as any)?.tenantId };
      const response = await supportService.createCannedResponse(data);
      wrapResult(res, response, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateCannedResponse(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const response = await supportService.updateCannedResponse(req.params.id as string, req.body);
      wrapResult(res, response);
    } catch (error) {
      next(error);
    }
  }

  public async deleteCannedResponse(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await supportService.deleteCannedResponse(req.params.id as string);
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  // ─── Categories ───────────────────────────────────────────────────────
  public async getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await supportService.getCategories();
      wrapResult(res, categories);
    } catch (error) {
      next(error);
    }
  }

  public async createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = { ...req.body, tenantId: (req.user as any)?.tenantId };
      const category = await supportService.createCategory(data);
      wrapResult(res, category, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await supportService.updateCategory(req.params.id as string, req.body);
      wrapResult(res, category);
    } catch (error) {
      next(error);
    }
  }

  public async deleteCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await supportService.deleteCategory(req.params.id as string);
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  // ─── SLA Configuration ────────────────────────────────────────────────
  public async getSLAConfigs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const configs = await supportService.getSLAConfigs();
      wrapResult(res, configs);
    } catch (error) {
      next(error);
    }
  }

  public async createSLAConfig(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = { ...req.body, tenantId: (req.user as any)?.tenantId };
      const config = await supportService.createSLAConfig(data);
      wrapResult(res, config, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateSLAConfig(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = await supportService.updateSLAConfig(req.params.id as string, req.body);
      wrapResult(res, config);
    } catch (error) {
      next(error);
    }
  }

  public async deleteSLAConfig(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await supportService.deleteSLAConfig(req.params.id as string);
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  // ─── Agent Workload ───────────────────────────────────────────────────
  public async getAgentWorkload(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const workload = await supportService.getAgentWorkload();
      wrapResult(res, workload);
    } catch (error) {
      next(error);
    }
  }

  // ─── SLA Breaches ─────────────────────────────────────────────────────
  public async getSLABreaches(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const breaches = await supportService.checkSLABreaches();
      wrapResult(res, breaches);
    } catch (error) {
      next(error);
    }
  }

  // ─── Auto-assign ──────────────────────────────────────────────────────
  public async autoAssignTicket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await supportService.autoAssign(req.params.id as string);
      wrapResult(res, ticket);
    } catch (error) {
      next(error);
    }
  }

  // ─── Escalation ─────────────────────────────────────────────────────
  public async escalateTicket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await supportService.escalateTicket(req.params.id as string, req.body);
      io.emit('ticket:escalated', { ticketId: ticket.id });
      wrapResult(res, ticket);
    } catch (error) {
      next(error);
    }
  }

  // ─── Reopen ─────────────────────────────────────────────────────────
  public async reopenTicket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await supportService.reopenTicket(req.params.id as string, req.body?.reason);
      wrapResult(res, ticket);
    } catch (error) {
      next(error);
    }
  }

  // ─── SLA Compliance Report ──────────────────────────────────────────
  public async getSLAComplianceReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await supportService.getSLAComplianceReport();
      wrapResult(res, report);
    } catch (error) {
      next(error);
    }
  }
}

export default new SupportController();
