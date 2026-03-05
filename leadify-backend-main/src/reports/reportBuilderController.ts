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
      const { config, format, title } = req.body;

      if (format === 'csv') {
        const result = await reportBuilderService.executeReport(config, req.user!.id);
        const csv = reportBuilderService.generateCSV(result.data, config.fields);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=report.csv');
        return res.send(csv);
      }

      if (format === 'pdf') {
        const pdfBuffer = await reportBuilderService.generatePdfFromConfig(config, req.user!.id, title);
        const filename = title ? `${title.replace(/\s+/g, '-').toLowerCase()}.pdf` : 'report.pdf';
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(pdfBuffer);
      }

      // For Excel and others, return JSON data for frontend generation
      const result = await reportBuilderService.executeReport(config, req.user!.id);
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

      if (format === 'pdf') {
        const { buffer, filename } = await reportBuilderService.generatePdfFromReport(Number(req.params.id), req.user!.id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(buffer);
      }

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
