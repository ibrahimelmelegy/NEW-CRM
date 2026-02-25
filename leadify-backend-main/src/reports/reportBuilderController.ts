import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import reportBuilderService from './reportBuilderService';
import { AuthenticatedRequest } from '../types';

class ReportBuilderController {
  /**
   * GET /api/reports/builder/fields
   * Return all available modules and their field definitions
   */
  async getAllFields(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const fields = reportBuilderService.getAllModuleFields();
      wrapResult(res, fields);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reports/builder/fields/:module
   * Return field definitions for a specific module
   */
  async getModuleFields(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const moduleKey = req.params.module;
      const fields = reportBuilderService.getModuleFields(moduleKey as string);
      if (!fields) {
        return wrapResult(res, { error: 'Module not found' }, 404);
      }
      wrapResult(res, fields);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/reports/builder/preview
   * Execute a report config and return preview data (no save)
   */
  async previewReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const config = req.body;
      const result = await reportBuilderService.executeReport(config, req.user!.id);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/reports/builder/export
   * Export report data directly from config (no save needed)
   */
  async exportFromConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { config, format } = req.body;
      const result = await reportBuilderService.executeReport(config, req.user!.id);

      if (format === 'csv') {
        const csv = reportBuilderService.generateCSV(result.data, config.fields);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=report.csv');
        return res.send(csv);
      }

      // For Excel and PDF, return JSON data for frontend generation
      wrapResult(res, {
        data: result.data,
        totalCount: result.totalCount,
        summary: result.summary
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/reports/:id/export
   * Export a saved report to a specific format
   */
  async exportReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const format = req.body.format || 'csv';
      const result = await reportBuilderService.exportReport(Number(req.params.id), format, req.user!.id);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${result.filename}`);
        return res.send(result.content);
      }

      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/reports/:id/schedule
   * Update the schedule configuration for a saved report
   */
  async scheduleReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schedule = req.body.schedule;
      const report = await reportBuilderService.scheduleReport(Number(req.params.id), schedule, req.user!.id);
      wrapResult(res, report);
    } catch (error) {
      next(error);
    }
  }
}

export default new ReportBuilderController();
