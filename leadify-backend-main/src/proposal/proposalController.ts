import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import proposalService from './proposalService';
import { AuthenticatedRequest } from '../types';
import User from '../user/userModel';
import pdfService from '../docBuilder/pdfService';
import Setting from '../setting/settingModel';

class ProposalController {
  public async createProposal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await proposalService.createProposal(req.body, req.user as User);
      wrapResult(res, responseFromService, 201);
    } catch (error) {
      next(error);
    }
  }

  public async assignUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await proposalService.assignUsers(req.params.id as string, req.body, req.user as User);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async approveProposal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await proposalService.approveProposal(req.params.id as string, req.user as User);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async rejectProposal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await proposalService.rejectProposal(req.params.id as string, req.body, req.user as User);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async waitingApprovalProposal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await proposalService.waitingApprovalProposal(req.params.id as string, req.user as User);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async updateProposal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await proposalService.updateProposal(req.params.id as string, req.body, req.user as User);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async getProposals(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await proposalService.getProposals(req.query, req.user as User);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async getProposalById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await proposalService.getProposalById(req.params.id as string, req.user as User);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async archiveProposal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await proposalService.archiveProposal(req.params.id as string, req.user as User);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async unarchiveProposal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await proposalService.unarchiveProposal(req.params.id as string, req.user as User);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async deleteProposal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await proposalService.deleteProposal(req.params.id as string, req.user as User);
      wrapResult(res);
    } catch (error) {
      next(error);
    }
  }

  public async sendProposalsExcelByEmail(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await proposalService.sendProposalsExcelByEmail(req.query, req.user as User, req.params.email as string);
      wrapResult(res);
    } catch (error) {
      next(error);
    }
  }

  public async generatePdf(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const proposal = await proposalService.getProposalForPdf(req.params.id as string, req.user as User);

      // Load company brand settings
      const settings = await Setting.findOne();

      const html = buildProposalHtml(proposal, settings);
      const { buffer, isPdf } = await pdfService.generatePdfBuffer(html);

      const filename = `Proposal-${proposal.reference || proposal.id}.${isPdf ? 'pdf' : 'html'}`;
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
// HTML builder for Proposal PDF
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

function buildProposalHtml(proposal: unknown, settings: unknown): string {
  const color = settings?.primaryColor || '#7c3aed';
  const companyName = settings?.name || '';
  const companyAddress = settings?.companyAddress || '';
  const companyEmail = settings?.email || '';
  const companyPhone = settings?.companyPhone || '';
  const companyTaxId = settings?.companyTaxId || '';
  const companyLogo = proposal.companyLogo || settings?.logo || '';
  const brandFooterText = settings?.brandFooterText || '';

  const client = proposal.client;
  const clientName = client?.clientName || proposal.proposalFor || '';
  const clientCompany = client?.companyName || '';
  const clientEmail = client?.email || '';
  const clientPhone = client?.phoneNumber || '';
  const clientAddress = client?.streetAddress || '';

  const financeTable = proposal.financeTable;
  const items = financeTable?.items || [];

  const subtotal = financeTable?.grandTotalPrice || items.reduce((sum: number, item: unknown) => sum + (item.totalPrice || 0), 0);
  const discount = financeTable?.discount || 0;
  const vat = financeTable?.vat || 0;
  const total = financeTable?.finalTotalPrice || (subtotal - discount + vat);

  // Parse rich content if present
  let contentSections = '';
  if (proposal.content) {
    try {
      const parsed = JSON.parse(proposal.content);
      if (parsed.introduction) {
        contentSections += `<div style="margin-bottom: 24px;"><h3 style="font-size: 16px; font-weight: 700; color: ${color}; margin-bottom: 8px;">Introduction</h3><div style="color: #475569; line-height: 1.7;">${parsed.introduction}</div></div>`;
      }
      if (parsed.objectives) {
        contentSections += `<div style="margin-bottom: 24px;"><h3 style="font-size: 16px; font-weight: 700; color: ${color}; margin-bottom: 8px;">Objectives</h3><div style="color: #475569; line-height: 1.7;">${parsed.objectives}</div></div>`;
      }
      if (parsed.scopeOfWork) {
        contentSections += `<div style="margin-bottom: 24px;"><h3 style="font-size: 16px; font-weight: 700; color: ${color}; margin-bottom: 8px;">Scope of Work</h3><div style="color: #475569; line-height: 1.7;">${parsed.scopeOfWork}</div></div>`;
      }
      if (parsed.methodology) {
        contentSections += `<div style="margin-bottom: 24px;"><h3 style="font-size: 16px; font-weight: 700; color: ${color}; margin-bottom: 8px;">Methodology</h3><div style="color: #475569; line-height: 1.7;">${parsed.methodology}</div></div>`;
      }
      if (parsed.customSections && Array.isArray(parsed.customSections)) {
        parsed.customSections.forEach((section: unknown) => {
          contentSections += `<div style="margin-bottom: 24px;"><h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">${escapeHtml(section.title)}</h3><div style="color: #475569; line-height: 1.6;">${section.content || ''}</div></div>`;
        });
      }
    } catch {
      // Content is plain text
      contentSections = `<div style="margin-bottom: 24px; color: #475569; line-height: 1.7;">${proposal.content}</div>`;
    }
  }

  const itemRows = items.map((item: unknown, i: number) => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9;">${i + 1}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-weight: 600;">${escapeHtml(item.description)}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; text-align: center;">${item.qty || 0}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; text-align: right;">${formatCurrency(item.unitPrice || 0)}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; text-align: right;">${formatCurrency(item.marginAmount || 0)}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700;">${formatCurrency(item.totalPrice || 0)}</td>
    </tr>
  `).join('');

  const statusColor: Record<string, string> = {
    APPROVED: '#22c55e',
    WAITING_APPROVAL: '#f59e0b',
    REJECTED: '#ef4444',
    DRAFT: '#94a3b8',
    ARCHIVED: '#64748b'
  };
  const statusBadgeColor = statusColor[proposal.status] || '#94a3b8';

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
      <h1 style="font-size: 28px; font-weight: 900; color: ${color}; text-transform: uppercase;">PROPOSAL</h1>
      <p style="font-size: 14px; font-weight: 700; color: #475569; margin-top: 4px;">${escapeHtml(proposal.reference || '')}</p>
      <p style="font-size: 12px; color: #64748b; margin-top: 2px;">Date: ${formatDate(proposal.proposalDate)}</p>
      <p style="font-size: 12px; color: #64748b;">Version: ${escapeHtml(proposal.version || '1.0')}</p>
      <span style="display: inline-block; margin-top: 8px; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; color: #fff; background: ${statusBadgeColor};">${escapeHtml(proposal.status || '')}</span>
    </div>
  </div>

  <!-- Title -->
  <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 24px;">${escapeHtml(proposal.title || '')}</h2>

  <!-- Client Info -->
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
    <h3 style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Prepared For</h3>
    ${clientCompany ? `<p style="font-size: 16px; font-weight: 700; color: #0f172a;">${escapeHtml(clientCompany)}</p>` : ''}
    ${clientName ? `<p style="font-size: 14px; color: #475569;">${escapeHtml(clientName)}</p>` : ''}
    ${clientEmail ? `<p style="font-size: 13px; color: #64748b;">${escapeHtml(clientEmail)}</p>` : ''}
    ${clientPhone ? `<p style="font-size: 13px; color: #64748b;">${escapeHtml(clientPhone)}</p>` : ''}
    ${clientAddress ? `<p style="font-size: 13px; color: #64748b;">${escapeHtml(clientAddress)}</p>` : ''}
    ${proposal.relatedEntity ? `<p style="font-size: 12px; color: #94a3b8; margin-top: 6px;">${escapeHtml(proposal.relatedEntityType || '')}: ${escapeHtml(proposal.relatedEntity.name || '')}</p>` : ''}
  </div>

  <!-- Content Sections -->
  ${contentSections}

  <!-- Items Table -->
  ${items.length > 0 ? `
  <h3 style="font-size: 16px; font-weight: 700; color: ${color}; margin-bottom: 12px;">Financial Details</h3>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
    <thead>
      <tr style="background: ${color}; color: #fff;">
        <th style="padding: 12px 16px; text-align: left; font-weight: 600; width: 40px;">#</th>
        <th style="padding: 12px 16px; text-align: left; font-weight: 600;">Description</th>
        <th style="padding: 12px 16px; text-align: center; font-weight: 600; width: 70px;">Qty</th>
        <th style="padding: 12px 16px; text-align: right; font-weight: 600; width: 120px;">Unit Price</th>
        <th style="padding: 12px 16px; text-align: right; font-weight: 600; width: 110px;">Margin</th>
        <th style="padding: 12px 16px; text-align: right; font-weight: 600; width: 130px;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>
  ` : ''}

  <!-- Totals -->
  <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
    <table style="width: 300px; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #64748b;">Subtotal</td>
        <td style="padding: 8px 0; text-align: right; font-weight: 600;">${formatCurrency(subtotal)}</td>
      </tr>
      ${discount > 0 ? `
      <tr>
        <td style="padding: 8px 0; color: #64748b;">Discount</td>
        <td style="padding: 8px 0; text-align: right; color: #ef4444;">-${formatCurrency(discount)}</td>
      </tr>
      ` : ''}
      ${vat > 0 ? `
      <tr>
        <td style="padding: 8px 0; color: #64748b;">VAT</td>
        <td style="padding: 8px 0; text-align: right;">${formatCurrency(vat)}</td>
      </tr>
      ` : ''}
      <tr style="border-top: 2px solid ${color};">
        <td style="padding: 12px 0; font-weight: 800; font-size: 16px; color: ${color};">Total</td>
        <td style="padding: 12px 0; text-align: right; font-weight: 800; font-size: 16px; color: ${color};">${formatCurrency(total)}</td>
      </tr>
    </table>
  </div>

  <!-- Notes -->
  ${proposal.notes ? `
  <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px; margin-bottom: 20px;">
    <h3 style="font-size: 12px; font-weight: 700; color: #92400e; margin-bottom: 4px;">Notes</h3>
    <div style="font-size: 12px; color: #78350f;">${escapeHtml(proposal.notes)}</div>
  </div>
  ` : ''}

  <!-- Assigned Users -->
  ${proposal.users && proposal.users.length > 0 ? `
  <div style="margin-bottom: 20px;">
    <h3 style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">Prepared By</h3>
    <p style="font-size: 13px; color: #475569;">${proposal.users.map((u: unknown) => escapeHtml(u.name)).join(', ')}</p>
  </div>
  ` : ''}

  <!-- Footer -->
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
    <p style="font-size: 11px; color: #94a3b8;">${brandFooterText ? escapeHtml(brandFooterText) : 'This document was generated by Leadify CRM'}</p>
  </div>
</body>
</html>`;
}

export default new ProposalController();
