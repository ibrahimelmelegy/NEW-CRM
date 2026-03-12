import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import invoiceService from './invoiceService';
import { AuthenticatedRequest } from '../types';
import pdfService from '../docBuilder/pdfService';
import Setting from '../setting/settingModel';

class InvoiceController {
  async getInvoices(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await invoiceService.getInvoices(req.query as Record<string, string>);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getInvoiceById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const invoice = await invoiceService.getInvoiceById(Number(req.params.id));
      wrapResult(res, invoice);
    } catch (error) {
      next(error);
    }
  }

  async markCollected(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const invoice = await invoiceService.markCollected(Number(req.params.id), req.body.collectedDate);
      wrapResult(res, invoice);
    } catch (error) {
      next(error);
    }
  }

  async markUncollected(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const invoice = await invoiceService.markUncollected(Number(req.params.id));
      wrapResult(res, invoice);
    } catch (error) {
      next(error);
    }
  }

  async getSummary(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const summary = await invoiceService.getSummary();
      wrapResult(res, summary);
    } catch (error) {
      next(error);
    }
  }

  async calculateTotals(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { items, taxRate, discountAmount, discountType } = req.body;
      if (!items || !Array.isArray(items)) {
        return wrapResult(res, { error: 'items array is required' }, 400);
      }
      const totals = invoiceService.calculateInvoiceTotals(items, taxRate, discountAmount, discountType);
      wrapResult(res, totals);
    } catch (error) {
      next(error);
    }
  }

  async getAgingReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId || undefined;
      const report = await invoiceService.getAgingReport(tenantId);
      wrapResult(res, report);
    } catch (error) {
      next(error);
    }
  }

  async getRevenueSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId || undefined;
      const period = Number(req.query.period) || 12;
      const summary = await invoiceService.getRevenueSummary(tenantId, period);
      wrapResult(res, summary);
    } catch (error) {
      next(error);
    }
  }

  async getOverdueInvoices(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId || undefined;
      const invoices = await invoiceService.getOverdueInvoices(tenantId);
      wrapResult(res, invoices);
    } catch (error) {
      next(error);
    }
  }

  async generatePdf(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const invoice = await invoiceService.getInvoiceById(Number(req.params.id));
      const settings = await Setting.findOne();

      const html = buildInvoiceHtml(invoice, settings);
      const { buffer, isPdf } = await pdfService.generatePdfBuffer(html);

      const filename = `Invoice-${invoice.invoiceNumber || invoice.id}.${isPdf ? 'pdf' : 'html'}`;
      const contentType = isPdf ? 'application/pdf' : 'text/html';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.end(buffer);
    } catch (error) {
      next(error);
    }
  }
}

// ---------------------------------------------------------------------------
// HTML builder for Invoice PDF
// ---------------------------------------------------------------------------

function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatCurrency(amount: number, currency: string = 'SAR'): string {
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function formatDate(dateStr?: string | Date): string {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function buildInvoiceHtml(invoice: Record<string, unknown>, settings: Record<string, unknown>): string {
  const color = settings?.primaryColor || '#7c3aed';
  const companyName = settings?.name || '';
  const companyAddress = settings?.companyAddress || '';
  const companyEmail = settings?.email || '';
  const companyPhone = settings?.companyPhone || '';
  const companyTaxId = settings?.companyTaxId || '';
  const companyLogo = settings?.logo || '';
  const brandFooterText = settings?.brandFooterText || '';

  const deal = invoice.deal || {};
  const dealName = deal.name || '';
  const clientName = deal.client?.clientName || deal.companyName || dealName;
  const clientCompany = deal.client?.companyName || deal.companyName || '';
  const clientEmail = deal.client?.email || '';
  const clientPhone = deal.client?.phoneNumber || '';
  const clientAddress = deal.client?.streetAddress || '';

  const amount = invoice.amount || 0;
  const statusLabel = invoice.collected ? 'PAID' : 'PENDING';
  const statusColor = invoice.collected ? '#22c55e' : '#f59e0b';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1e293b; background: #fff; }
    @page { size: A4; margin: 20mm; }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid ${color};">
    <div style="display: flex; align-items: center; gap: 16px;">
      ${companyLogo ? `<img src="${companyLogo}" alt="Logo" style="max-height: 60px; max-width: 180px; object-fit: contain;" />` : ''}
      <div>
        ${companyName ? `<h2 style="font-size: 20px; font-weight: 800; color: ${color};">${escapeHtml(companyName)}</h2>` : ''}
        ${companyAddress ? `<p style="font-size: 12px; color: #64748b; margin-top: 4px;">${escapeHtml(companyAddress)}</p>` : ''}
        ${companyEmail ? `<p style="font-size: 12px; color: #64748b;">${escapeHtml(companyEmail)}${companyPhone ? ' | ' + escapeHtml(companyPhone) : ''}</p>` : ''}
        ${companyTaxId ? `<p style="font-size: 11px; color: #94a3b8; margin-top: 2px;">VAT: ${escapeHtml(companyTaxId)}</p>` : ''}
      </div>
    </div>
    <div style="text-align: right;">
      <h1 style="font-size: 28px; font-weight: 900; color: ${color}; text-transform: uppercase;">INVOICE</h1>
      <p style="font-size: 14px; font-weight: 700; color: #475569; margin-top: 4px;">${escapeHtml(invoice.invoiceNumber || '')}</p>
      <p style="font-size: 12px; color: #64748b; margin-top: 2px;">Date: ${formatDate(invoice.invoiceDate)}</p>
      ${invoice.dueDate ? `<p style="font-size: 12px; color: #64748b;">Due: ${formatDate(invoice.dueDate)}</p>` : ''}
      <span style="display: inline-block; margin-top: 8px; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; color: #fff; background: ${statusColor};">${statusLabel}</span>
    </div>
  </div>

  <!-- Two Column Layout: Bill To / Invoice Details -->
  <div style="display: flex; gap: 24px; margin-bottom: 30px;">
    <!-- Bill To -->
    <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
      <h3 style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Bill To</h3>
      ${clientCompany ? `<p style="font-size: 16px; font-weight: 700; color: #0f172a;">${escapeHtml(clientCompany)}</p>` : ''}
      ${clientName ? `<p style="font-size: 14px; color: #475569;">${escapeHtml(clientName)}</p>` : ''}
      ${clientEmail ? `<p style="font-size: 13px; color: #64748b;">${escapeHtml(clientEmail)}</p>` : ''}
      ${clientPhone ? `<p style="font-size: 13px; color: #64748b;">${escapeHtml(clientPhone)}</p>` : ''}
      ${clientAddress ? `<p style="font-size: 13px; color: #64748b;">${escapeHtml(clientAddress)}</p>` : ''}
    </div>

    <!-- Invoice Details -->
    <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
      <h3 style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Invoice Details</h3>
      <table style="font-size: 13px; color: #475569; width: 100%;">
        <tr><td style="padding: 4px 0; color: #64748b;">Invoice #</td><td style="padding: 4px 0; text-align: right; font-weight: 600;">${escapeHtml(invoice.invoiceNumber || '')}</td></tr>
        <tr><td style="padding: 4px 0; color: #64748b;">Date</td><td style="padding: 4px 0; text-align: right;">${formatDate(invoice.invoiceDate)}</td></tr>
        ${invoice.dueDate ? `<tr><td style="padding: 4px 0; color: #64748b;">Due Date</td><td style="padding: 4px 0; text-align: right;">${formatDate(invoice.dueDate)}</td></tr>` : ''}
        <tr><td style="padding: 4px 0; color: #64748b;">Deal</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(dealName)}</td></tr>
        ${invoice.collected && invoice.collectedDate ? `<tr><td style="padding: 4px 0; color: #64748b;">Collected</td><td style="padding: 4px 0; text-align: right; color: #22c55e;">${formatDate(invoice.collectedDate)}</td></tr>` : ''}
      </table>
    </div>
  </div>

  <!-- Line Items Table -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
    <thead>
      <tr style="background: ${color}; color: #fff;">
        <th style="padding: 12px 16px; text-align: left; font-weight: 600; width: 40px;">#</th>
        <th style="padding: 12px 16px; text-align: left; font-weight: 600;">Description</th>
        <th style="padding: 12px 16px; text-align: center; font-weight: 600; width: 80px;">Qty</th>
        <th style="padding: 12px 16px; text-align: right; font-weight: 600; width: 130px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9;">1</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-weight: 600;">${escapeHtml(dealName || 'Invoice')}</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; text-align: center;">1</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700;">${formatCurrency(amount)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Totals -->
  <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
    <table style="width: 280px; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #64748b;">Subtotal</td>
        <td style="padding: 8px 0; text-align: right; font-weight: 600;">${formatCurrency(amount)}</td>
      </tr>
      <tr style="border-top: 2px solid ${color};">
        <td style="padding: 12px 0; font-weight: 800; font-size: 16px; color: ${color};">Total</td>
        <td style="padding: 12px 0; text-align: right; font-weight: 800; font-size: 16px; color: ${color};">${formatCurrency(amount)}</td>
      </tr>
    </table>
  </div>

  <!-- Payment Status Banner -->
  ${
    invoice.collected
      ? `
  <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
    <p style="font-size: 16px; font-weight: 800; color: #16a34a;">PAID</p>
    ${invoice.collectedDate ? `<p style="font-size: 12px; color: #15803d; margin-top: 4px;">Collected on ${formatDate(invoice.collectedDate)}</p>` : ''}
  </div>
  `
      : `
  <div style="background: #fffbeb; border: 2px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
    <p style="font-size: 16px; font-weight: 800; color: #d97706;">PAYMENT PENDING</p>
    ${invoice.dueDate ? `<p style="font-size: 12px; color: #b45309; margin-top: 4px;">Due by ${formatDate(invoice.dueDate)}</p>` : ''}
  </div>
  `
  }

  <!-- Footer -->
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
    <p style="font-size: 11px; color: #94a3b8;">${brandFooterText ? escapeHtml(brandFooterText) : 'This document was generated by Leadify CRM'}</p>
  </div>
</body>
</html>`;
}

export default new InvoiceController();
