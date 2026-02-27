/**
 * Server-side HTML template renderer for document PDF generation.
 * Takes document content JSON and type, renders to static HTML string.
 *
 * Supports two rendering paths:
 * 1. renderDocumentHtml() — hardcoded layout (legacy, used when no template is selected)
 * 2. renderWithTemplate() — uses DocumentTemplate layout + brand settings via templateEngine
 */
import { renderFromTemplate, type BrandSettings } from './templateEngine';

interface LineItem {
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  cost?: number;
  margin?: number;
}

interface DocumentContent {
  title?: string;
  refNumber?: string;
  date?: string;
  validUntil?: string;
  dueDate?: string;
  documentType?: string;
  themeColor?: string;
  // Client
  clientName?: string;
  clientCompany?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientTaxId?: string;
  // Company
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyTaxId?: string;
  // Bank
  bankName?: string;
  bankAccountName?: string;
  bankIban?: string;
  bankSwift?: string;
  // Content sections
  introduction?: string;
  objectives?: string;
  scopeOfWork?: string;
  methodology?: string;
  customSections?: { title: string; content: string }[];
  // Financial
  currency?: string;
  items?: LineItem[];
  taxRate?: number;
  discount?: number;
  discountType?: string;
  // Terms
  paymentTerms?: string;
  termsAndConditions?: string;
  notes?: string;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatCurrency(amount: number, currency: string = 'SAR'): string {
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function renderDocumentHtml(content: DocumentContent, type: string): string {
  const color = content.themeColor || '#7c3aed';
  const currency = content.currency || 'SAR';
  const items = content.items || [];

  const subtotal = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.rate || 0), 0);
  const discountAmount = content.discountType === 'percent' ? subtotal * ((content.discount || 0) / 100) : content.discount || 0;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * ((content.taxRate || 0) / 100);
  const total = taxableAmount + taxAmount;

  const typeLabel = (type || 'document').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const itemRows = items
    .map(
      (item, i) => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9;">${i + 1}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-weight: 600;">${escapeHtml(item.description)}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; text-align: center;">${escapeHtml(item.unit || 'Unit')}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; text-align: right;">${formatCurrency(item.rate, currency)}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700;">${formatCurrency(item.quantity * item.rate, currency)}</td>
    </tr>
  `
    )
    .join('');

  const customSectionsHtml = (content.customSections || [])
    .map(
      section => `
    <div style="margin-bottom: 24px;">
      <h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">${escapeHtml(section.title)}</h3>
      <div style="color: #475569; line-height: 1.6;">${section.content || ''}</div>
    </div>
  `
    )
    .join('');

  const isFullDoc = ['proposal', 'contract'].includes(type);

  const fontFamily = "'Segoe UI', system-ui, -apple-system, sans-serif";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: ${fontFamily}; color: #1e293b; background: #fff; }
    @page { size: A4; margin: 20mm; }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid ${color};">
    <div>
      ${content.companyName ? `<h2 style="font-size: 20px; font-weight: 800; color: ${color};">${escapeHtml(content.companyName)}</h2>` : ''}
      ${content.companyAddress ? `<p style="font-size: 12px; color: #64748b; margin-top: 4px;">${escapeHtml(content.companyAddress)}</p>` : ''}
      ${content.companyEmail ? `<p style="font-size: 12px; color: #64748b;">${escapeHtml(content.companyEmail)}${content.companyPhone ? ' | ' + escapeHtml(content.companyPhone) : ''}</p>` : ''}
      ${content.companyTaxId ? `<p style="font-size: 11px; color: #94a3b8; margin-top: 2px;">VAT: ${escapeHtml(content.companyTaxId)}</p>` : ''}
    </div>
    <div style="text-align: right;">
      <h1 style="font-size: 28px; font-weight: 900; color: ${color}; text-transform: uppercase;">${escapeHtml(typeLabel)}</h1>
      <p style="font-size: 14px; font-weight: 700; color: #475569; margin-top: 4px;">${escapeHtml(content.refNumber || '')}</p>
      <p style="font-size: 12px; color: #64748b; margin-top: 2px;">Date: ${formatDate(content.date)}</p>
      ${content.dueDate ? `<p style="font-size: 12px; color: #64748b;">Due: ${formatDate(content.dueDate)}</p>` : ''}
      ${content.validUntil ? `<p style="font-size: 12px; color: #64748b;">Valid Until: ${formatDate(content.validUntil)}</p>` : ''}
    </div>
  </div>

  <!-- Title -->
  <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 24px;">${escapeHtml(content.title || '')}</h2>

  <!-- Client Info -->
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
    <h3 style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Bill To</h3>
    ${content.clientCompany ? `<p style="font-size: 16px; font-weight: 700; color: #0f172a;">${escapeHtml(content.clientCompany)}</p>` : ''}
    ${content.clientName ? `<p style="font-size: 14px; color: #475569;">${escapeHtml(content.clientName)}</p>` : ''}
    ${content.clientEmail ? `<p style="font-size: 13px; color: #64748b;">${escapeHtml(content.clientEmail)}</p>` : ''}
    ${content.clientPhone ? `<p style="font-size: 13px; color: #64748b;">${escapeHtml(content.clientPhone)}</p>` : ''}
    ${content.clientAddress ? `<p style="font-size: 13px; color: #64748b;">${escapeHtml(content.clientAddress)}</p>` : ''}
    ${content.clientTaxId ? `<p style="font-size: 12px; color: #94a3b8;">VAT: ${escapeHtml(content.clientTaxId)}</p>` : ''}
  </div>

  ${
    isFullDoc
      ? `
  <!-- Content Sections -->
  ${content.introduction ? `<div style="margin-bottom: 24px;"><h3 style="font-size: 16px; font-weight: 700; color: ${color}; margin-bottom: 8px;">Introduction</h3><div style="color: #475569; line-height: 1.7;">${content.introduction}</div></div>` : ''}
  ${content.objectives ? `<div style="margin-bottom: 24px;"><h3 style="font-size: 16px; font-weight: 700; color: ${color}; margin-bottom: 8px;">Objectives</h3><div style="color: #475569; line-height: 1.7;">${content.objectives}</div></div>` : ''}
  ${content.scopeOfWork ? `<div style="margin-bottom: 24px;"><h3 style="font-size: 16px; font-weight: 700; color: ${color}; margin-bottom: 8px;">Scope of Work</h3><div style="color: #475569; line-height: 1.7;">${content.scopeOfWork}</div></div>` : ''}
  ${content.methodology ? `<div style="margin-bottom: 24px;"><h3 style="font-size: 16px; font-weight: 700; color: ${color}; margin-bottom: 8px;">Methodology</h3><div style="color: #475569; line-height: 1.7;">${content.methodology}</div></div>` : ''}
  ${customSectionsHtml}
  `
      : ''
  }

  <!-- Items Table -->
  ${
    items.length > 0
      ? `
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
    <thead>
      <tr style="background: ${color}; color: #fff;">
        <th style="padding: 12px 16px; text-align: left; font-weight: 600; width: 40px;">#</th>
        <th style="padding: 12px 16px; text-align: left; font-weight: 600;">Description</th>
        <th style="padding: 12px 16px; text-align: center; font-weight: 600; width: 70px;">Qty</th>
        <th style="padding: 12px 16px; text-align: center; font-weight: 600; width: 80px;">Unit</th>
        <th style="padding: 12px 16px; text-align: right; font-weight: 600; width: 120px;">Rate</th>
        <th style="padding: 12px 16px; text-align: right; font-weight: 600; width: 130px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>
  `
      : ''
  }

  <!-- Totals -->
  <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
    <table style="width: 280px; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #64748b;">Subtotal</td>
        <td style="padding: 8px 0; text-align: right; font-weight: 600;">${formatCurrency(subtotal, currency)}</td>
      </tr>
      ${
        discountAmount > 0
          ? `
      <tr>
        <td style="padding: 8px 0; color: #64748b;">Discount${content.discountType === 'percent' ? ` (${content.discount}%)` : ''}</td>
        <td style="padding: 8px 0; text-align: right; color: #ef4444;">-${formatCurrency(discountAmount, currency)}</td>
      </tr>
      `
          : ''
      }
      ${
        (content.taxRate || 0) > 0
          ? `
      <tr>
        <td style="padding: 8px 0; color: #64748b;">VAT (${content.taxRate}%)</td>
        <td style="padding: 8px 0; text-align: right;">${formatCurrency(taxAmount, currency)}</td>
      </tr>
      `
          : ''
      }
      <tr style="border-top: 2px solid ${color};">
        <td style="padding: 12px 0; font-weight: 800; font-size: 16px; color: ${color};">Total</td>
        <td style="padding: 12px 0; text-align: right; font-weight: 800; font-size: 16px; color: ${color};">${formatCurrency(total, currency)}</td>
      </tr>
    </table>
  </div>

  <!-- Bank Details -->
  ${
    content.bankName
      ? `
  <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
    <h3 style="font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Bank Details</h3>
    <p style="font-size: 13px; color: #0c4a6e;"><strong>Bank:</strong> ${escapeHtml(content.bankName)}</p>
    ${content.bankAccountName ? `<p style="font-size: 13px; color: #0c4a6e;"><strong>Account:</strong> ${escapeHtml(content.bankAccountName)}</p>` : ''}
    ${content.bankIban ? `<p style="font-size: 13px; color: #0c4a6e;"><strong>IBAN:</strong> ${escapeHtml(content.bankIban)}</p>` : ''}
    ${content.bankSwift ? `<p style="font-size: 13px; color: #0c4a6e;"><strong>SWIFT:</strong> ${escapeHtml(content.bankSwift)}</p>` : ''}
  </div>
  `
      : ''
  }

  <!-- Terms -->
  ${
    content.paymentTerms
      ? `
  <div style="margin-bottom: 20px;">
    <h3 style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">Payment Terms</h3>
    <div style="font-size: 13px; color: #475569; line-height: 1.6;">${content.paymentTerms}</div>
  </div>
  `
      : ''
  }
  ${
    content.termsAndConditions
      ? `
  <div style="margin-bottom: 20px;">
    <h3 style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">Terms & Conditions</h3>
    <div style="font-size: 12px; color: #64748b; line-height: 1.6;">${content.termsAndConditions}</div>
  </div>
  `
      : ''
  }
  ${
    content.notes
      ? `
  <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px; margin-bottom: 20px;">
    <h3 style="font-size: 12px; font-weight: 700; color: #92400e; margin-bottom: 4px;">Notes</h3>
    <div style="font-size: 12px; color: #78350f;">${content.notes}</div>
  </div>
  `
      : ''
  }

  <!-- Footer -->
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
    <p style="font-size: 11px; color: #94a3b8;">This document was generated by Leadify CRM</p>
  </div>
</body>
</html>`;
}

/**
 * Render a document using a DocumentTemplate's HTML layout + brand settings.
 * Falls back to renderDocumentHtml() if no templateHtml is provided.
 */
export function renderWithTemplate(
  content: DocumentContent,
  type: string,
  templateHtml?: string,
  brand?: BrandSettings
): string {
  if (!templateHtml) {
    return renderDocumentHtml(content, type);
  }

  return renderFromTemplate(templateHtml, content as Record<string, any>, brand);
}
