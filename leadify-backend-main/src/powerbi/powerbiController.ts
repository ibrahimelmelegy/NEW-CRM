import { Request, Response, NextFunction } from 'express';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/db';
import { wrapResult } from '../utils/response/responseWrapper';

class PowerBIController {
  // GET /api/powerbi/leads
  public async getLeads(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await sequelize.query(
        `SELECT id, full_name, email, phone, status, source, score,
                created_at, updated_at, tenant_id
         FROM leads
         ORDER BY created_at DESC`,
        { type: QueryTypes.SELECT }
      );
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/powerbi/deals
  public async getDeals(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await sequelize.query(
        `SELECT d.id, d.title, d.value, d.stage, d.status,
                d.expected_close_date, d.created_at, d.updated_at,
                c.full_name AS client_name, d.tenant_id
         FROM deals d
         LEFT JOIN clients c ON d.client_id = c.id
         ORDER BY d.created_at DESC`,
        { type: QueryTypes.SELECT }
      );
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/powerbi/clients
  public async getClients(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await sequelize.query(
        `SELECT id, full_name, email, phone, company, status,
                created_at, updated_at, tenant_id
         FROM clients
         ORDER BY created_at DESC`,
        { type: QueryTypes.SELECT }
      );
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/powerbi/tasks
  public async getTasks(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await sequelize.query(
        `SELECT id, title, status, priority, due_date,
                created_at, updated_at, tenant_id
         FROM tasks
         ORDER BY created_at DESC`,
        { type: QueryTypes.SELECT }
      );
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/powerbi/invoices
  public async getInvoices(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await sequelize.query(
        `SELECT id, invoice_number, total_amount, status,
                issue_date, due_date, created_at, updated_at, tenant_id
         FROM invoices
         ORDER BY created_at DESC`,
        { type: QueryTypes.SELECT }
      );
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/powerbi/summary  - dashboard overview
  public async getSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [leads, deals, clients, tasks, invoices] = await Promise.all([
        sequelize.query(
          `SELECT status, COUNT(*) AS count FROM leads GROUP BY status`,
          { type: QueryTypes.SELECT }
        ),
        sequelize.query(
          `SELECT stage, COUNT(*) AS count, COALESCE(SUM(value),0) AS total_value
           FROM deals GROUP BY stage`,
          { type: QueryTypes.SELECT }
        ),
        sequelize.query(
          `SELECT COUNT(*) AS total_clients FROM clients`,
          { type: QueryTypes.SELECT }
        ),
        sequelize.query(
          `SELECT status, COUNT(*) AS count FROM tasks GROUP BY status`,
          { type: QueryTypes.SELECT }
        ),
        sequelize.query(
          `SELECT status, COUNT(*) AS count, COALESCE(SUM(total_amount),0) AS total
           FROM invoices GROUP BY status`,
          { type: QueryTypes.SELECT }
        ),
      ]);

      wrapResult(res, { leads, deals, clients, tasks, invoices });
    } catch (error) {
      next(error);
    }
  }
}

export default new PowerBIController();
