/**
 * Seed script for pre-built document templates.
 * Populates the document_templates table with 12 professional system templates.
 *
 * Usage:
 *   npx ts-node src/docBuilder/seedTemplates.ts
 *
 * Or import and call seedTemplates() from your app bootstrap.
 */

import { sequelize } from '../config/db';
import DocumentTemplate, { DocumentTemplateType } from '../documentTemplate/documentTemplateModel';

/* ────────────────────────────────────────────────────────────────────────────
 * Shared CSS reset used by every template
 * ──────────────────────────────────────────────────────────────────────────── */
const BASE_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: {{brand.fontFamily}}; color: #1e293b; background: #fff; line-height: 1.5; }
@page { size: A4; margin: 20mm; }
table { border-collapse: collapse; }
`.trim();

/* ════════════════════════════════════════════════════════════════════════════
 * TEMPLATE DEFINITIONS
 * ════════════════════════════════════════════════════════════════════════════ */

interface SeedTemplate {
  name: string;
  type: DocumentTemplateType;
  isDefault: boolean;
  layout: {
    pageSize: string;
    orientation: 'portrait' | 'landscape';
    margins: { top: number; right: number; bottom: number; left: number };
    elements: [];
    variables: string[];
    templateHtml: string;
  };
  headerConfig: Record<string, any>;
  footerConfig: Record<string, any>;
  tableConfig: Record<string, any>;
}

const COMMON_VARS = [
  'brand.companyName', 'brand.companyAddress', 'brand.companyEmail', 'brand.companyPhone',
  'brand.companyTaxId', 'brand.primaryColor', 'brand.footerText', 'brand.logo',
  'refNumber', 'formattedDate', 'formattedDueDate', 'formattedValidUntil',
  'clientName', 'clientCompany', 'clientEmail', 'clientPhone', 'clientAddress', 'clientTaxId',
  'subtotal', 'discountAmount', 'taxAmount', 'total', 'currency',
  'bankName', 'bankAccountName', 'bankIban', 'bankSwift',
  'notes', 'paymentTerms', 'termsAndConditions'
];

/* ─── 1. Invoice Classic ──────────────────────────────────────────────────── */
const invoiceClassicHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><style>${BASE_CSS}</style></head>
<body style="padding: 0; font-size: 13px;">
  <!-- Header -->
  <table style="width: 100%; margin-bottom: 30px; border-bottom: 3px double {{brand.primaryColor}}; padding-bottom: 16px;">
    <tr>
      <td style="vertical-align: top; width: 60%;">
        <div style="font-size: 22px; font-weight: 800; color: {{brand.primaryColor}}; margin-bottom: 4px;">{{brand.companyName}}</div>
        <div style="font-size: 11px; color: #64748b; line-height: 1.6;">{{brand.companyAddress}}</div>
        <div style="font-size: 11px; color: #64748b;">{{brand.companyEmail}} | {{brand.companyPhone}}</div>
        {{#if brand.companyTaxId}}<div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">VAT: {{brand.companyTaxId}}</div>{{/if}}
      </td>
      <td style="vertical-align: top; text-align: right;">
        <div style="font-size: 32px; font-weight: 900; color: {{brand.primaryColor}}; letter-spacing: 2px;">INVOICE</div>
        <div style="font-size: 14px; font-weight: 700; color: #334155; margin-top: 6px;">{{refNumber}}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Date: {{formattedDate}}</div>
        {{#if formattedDueDate}}<div style="font-size: 12px; color: #64748b;">Due: {{formattedDueDate}}</div>{{/if}}
      </td>
    </tr>
  </table>

  <!-- Bill To -->
  <table style="width: 100%; margin-bottom: 28px;">
    <tr>
      <td style="width: 50%; vertical-align: top;">
        <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Bill To</div>
        <div style="font-size: 15px; font-weight: 700; color: #0f172a;">{{clientCompany}}</div>
        <div style="font-size: 13px; color: #475569;">{{clientName}}</div>
        <div style="font-size: 12px; color: #64748b;">{{clientEmail}}</div>
        {{#if clientAddress}}<div style="font-size: 12px; color: #64748b;">{{clientAddress}}</div>{{/if}}
        {{#if clientTaxId}}<div style="font-size: 11px; color: #94a3b8;">VAT: {{clientTaxId}}</div>{{/if}}
      </td>
      <td style="width: 50%; vertical-align: top; text-align: right;">
        {{#if formattedDueDate}}
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px; display: inline-block;">
          <div style="font-size: 10px; color: #991b1b; font-weight: 700; text-transform: uppercase;">Amount Due</div>
          <div style="font-size: 22px; font-weight: 800; color: #dc2626;">{{total}} {{currency}}</div>
        </div>
        {{/if}}
      </td>
    </tr>
  </table>

  <!-- Items Table -->
  <table style="width: 100%; margin-bottom: 24px; font-size: 12px;">
    <thead>
      <tr style="background: {{brand.primaryColor}}; color: #fff;">
        <th style="padding: 10px 14px; text-align: left; font-weight: 600; width: 36px;">#</th>
        <th style="padding: 10px 14px; text-align: left; font-weight: 600;">Description</th>
        <th style="padding: 10px 14px; text-align: center; font-weight: 600; width: 60px;">Qty</th>
        <th style="padding: 10px 14px; text-align: right; font-weight: 600; width: 110px;">Rate</th>
        <th style="padding: 10px 14px; text-align: right; font-weight: 600; width: 120px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr style="background: {{#if @even}}#f8fafc{{else}}#fff{{/if}};">
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0;">{{index}}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">{{description}}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: center;">{{quantity}}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: right;">{{rate}}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700;">{{lineTotal}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <!-- Totals -->
  <table style="width: 260px; margin-left: auto; font-size: 13px; margin-bottom: 30px;">
    <tr><td style="padding: 6px 0; color: #64748b;">Subtotal</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">{{subtotal}} {{currency}}</td></tr>
    {{#if hasDiscount}}<tr><td style="padding: 6px 0; color: #64748b;">Discount</td><td style="padding: 6px 0; text-align: right; color: #ef4444;">-{{discountAmount}} {{currency}}</td></tr>{{/if}}
    {{#if hasTax}}<tr><td style="padding: 6px 0; color: #64748b;">VAT</td><td style="padding: 6px 0; text-align: right;">{{taxAmount}} {{currency}}</td></tr>{{/if}}
    <tr style="border-top: 2px solid {{brand.primaryColor}};"><td style="padding: 10px 0; font-weight: 800; font-size: 15px; color: {{brand.primaryColor}};">Total</td><td style="padding: 10px 0; text-align: right; font-weight: 800; font-size: 15px; color: {{brand.primaryColor}};">{{total}} {{currency}}</td></tr>
  </table>

  <!-- Bank Details -->
  {{#if hasBank}}
  <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 14px; margin-bottom: 20px;">
    <div style="font-size: 10px; font-weight: 700; color: #0284c7; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Bank Details</div>
    <div style="font-size: 12px; color: #0c4a6e;">Bank: {{bankName}} | Account: {{bankAccountName}}</div>
    <div style="font-size: 12px; color: #0c4a6e;">IBAN: {{bankIban}} {{#if bankSwift}}| SWIFT: {{bankSwift}}{{/if}}</div>
  </div>
  {{/if}}

  <!-- Notes -->
  {{#if hasNotes}}
  <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 12px; margin-bottom: 18px;">
    <div style="font-size: 11px; font-weight: 700; color: #92400e; margin-bottom: 4px;">Notes</div>
    <div style="font-size: 12px; color: #78350f;">{{notes}}</div>
  </div>
  {{/if}}

  {{#if hasPaymentTerms}}
  <div style="margin-bottom: 16px;">
    <div style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 4px;">Payment Terms</div>
    <div style="font-size: 11px; color: #64748b;">{{paymentTerms}}</div>
  </div>
  {{/if}}

  <!-- Footer -->
  <div style="margin-top: 40px; padding-top: 14px; border-top: 1px solid #e2e8f0; text-align: center;">
    <div style="font-size: 10px; color: #94a3b8;">{{brand.footerText}}</div>
  </div>
</body></html>`;

/* ─── 2. Invoice Modern ───────────────────────────────────────────────────── */
const invoiceModernHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><style>${BASE_CSS}</style></head>
<body style="padding: 0; font-size: 13px;">
  <!-- Accent Bar -->
  <div style="height: 6px; background: linear-gradient(90deg, {{brand.primaryColor}}, {{brand.primaryColor}}88); margin-bottom: 32px;"></div>

  <!-- Header -->
  <table style="width: 100%; margin-bottom: 36px;">
    <tr>
      <td style="vertical-align: top; width: 50%;">
        <div style="font-size: 24px; font-weight: 300; color: #0f172a; letter-spacing: -0.5px;">{{brand.companyName}}</div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 6px; line-height: 1.6;">{{brand.companyAddress}}<br>{{brand.companyEmail}}<br>{{brand.companyPhone}}</div>
      </td>
      <td style="vertical-align: top; text-align: right;">
        <div style="font-size: 11px; font-weight: 600; color: {{brand.primaryColor}}; text-transform: uppercase; letter-spacing: 3px;">Invoice</div>
        <div style="font-size: 28px; font-weight: 200; color: #0f172a; margin-top: 4px;">{{refNumber}}</div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 8px;">Issued {{formattedDate}}</div>
        {{#if formattedDueDate}}<div style="font-size: 11px; color: #94a3b8;">Due {{formattedDueDate}}</div>{{/if}}
      </td>
    </tr>
  </table>

  <!-- Client -->
  <div style="border-left: 3px solid {{brand.primaryColor}}; padding-left: 16px; margin-bottom: 32px;">
    <div style="font-size: 10px; font-weight: 600; color: {{brand.primaryColor}}; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px;">Billed To</div>
    <div style="font-size: 15px; font-weight: 600; color: #0f172a;">{{clientCompany}}</div>
    <div style="font-size: 12px; color: #64748b;">{{clientName}} &middot; {{clientEmail}}</div>
    {{#if clientAddress}}<div style="font-size: 12px; color: #64748b;">{{clientAddress}}</div>{{/if}}
  </div>

  <!-- Items -->
  <table style="width: 100%; margin-bottom: 24px; font-size: 12px;">
    <thead>
      <tr style="border-bottom: 2px solid {{brand.primaryColor}};">
        <th style="padding: 10px 0; text-align: left; font-weight: 600; color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Description</th>
        <th style="padding: 10px 0; text-align: center; font-weight: 600; color: #64748b; font-size: 10px; text-transform: uppercase; width: 60px;">Qty</th>
        <th style="padding: 10px 0; text-align: right; font-weight: 600; color: #64748b; font-size: 10px; text-transform: uppercase; width: 100px;">Rate</th>
        <th style="padding: 10px 0; text-align: right; font-weight: 600; color: #64748b; font-size: 10px; text-transform: uppercase; width: 110px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">{{description}}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: center;">{{quantity}}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">{{rate}}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">{{lineTotal}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <!-- Totals -->
  <table style="width: 240px; margin-left: auto; font-size: 13px; margin-bottom: 32px;">
    <tr><td style="padding: 5px 0; color: #94a3b8; font-size: 12px;">Subtotal</td><td style="text-align: right;">{{subtotal}}</td></tr>
    {{#if hasDiscount}}<tr><td style="padding: 5px 0; color: #94a3b8; font-size: 12px;">Discount</td><td style="text-align: right; color: #ef4444;">-{{discountAmount}}</td></tr>{{/if}}
    {{#if hasTax}}<tr><td style="padding: 5px 0; color: #94a3b8; font-size: 12px;">Tax</td><td style="text-align: right;">{{taxAmount}}</td></tr>{{/if}}
    <tr style="border-top: 1px solid #e2e8f0;">
      <td style="padding: 12px 0; font-size: 16px; font-weight: 700; color: {{brand.primaryColor}};">Total</td>
      <td style="padding: 12px 0; text-align: right; font-size: 16px; font-weight: 700; color: {{brand.primaryColor}};">{{total}} {{currency}}</td>
    </tr>
  </table>

  {{#if hasBank}}
  <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-bottom: 20px;">
    <div style="font-size: 10px; font-weight: 600; color: {{brand.primaryColor}}; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px;">Payment Details</div>
    <div style="font-size: 12px; color: #475569;">{{bankName}} &middot; {{bankAccountName}} &middot; IBAN: {{bankIban}}</div>
  </div>
  {{/if}}

  {{#if hasNotes}}
  <div style="border-left: 3px solid #fbbf24; padding-left: 12px; margin-bottom: 18px;">
    <div style="font-size: 12px; color: #78350f;">{{notes}}</div>
  </div>
  {{/if}}

  <div style="margin-top: 40px; text-align: center;">
    <div style="font-size: 10px; color: #cbd5e1;">{{brand.footerText}}</div>
  </div>
</body></html>`;

/* ─── 3. Invoice Minimal ──────────────────────────────────────────────────── */
const invoiceMinimalHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><style>${BASE_CSS}</style></head>
<body style="padding: 0; font-size: 13px; color: #374151;">
  <table style="width: 100%; margin-bottom: 48px;">
    <tr>
      <td style="vertical-align: bottom;">
        <div style="font-size: 28px; font-weight: 800; color: #111827;">{{brand.companyName}}</div>
      </td>
      <td style="vertical-align: bottom; text-align: right;">
        <div style="font-size: 36px; font-weight: 200; color: #d1d5db; text-transform: uppercase;">Invoice</div>
      </td>
    </tr>
  </table>

  <table style="width: 100%; margin-bottom: 40px; font-size: 12px; color: #6b7280;">
    <tr>
      <td style="vertical-align: top; width: 33%;">
        <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #9ca3af; margin-bottom: 8px;">From</div>
        <div>{{brand.companyName}}</div>
        <div>{{brand.companyAddress}}</div>
        <div>{{brand.companyEmail}}</div>
      </td>
      <td style="vertical-align: top; width: 33%;">
        <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #9ca3af; margin-bottom: 8px;">To</div>
        <div style="font-weight: 600; color: #111827;">{{clientCompany}}</div>
        <div>{{clientName}}</div>
        <div>{{clientEmail}}</div>
      </td>
      <td style="vertical-align: top; width: 33%; text-align: right;">
        <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #9ca3af; margin-bottom: 8px;">Details</div>
        <div><span style="color: #9ca3af;">No.</span> {{refNumber}}</div>
        <div><span style="color: #9ca3af;">Date</span> {{formattedDate}}</div>
        {{#if formattedDueDate}}<div><span style="color: #9ca3af;">Due</span> {{formattedDueDate}}</div>{{/if}}
      </td>
    </tr>
  </table>

  <table style="width: 100%; margin-bottom: 32px; font-size: 12px;">
    <thead>
      <tr>
        <th style="padding: 12px 0; text-align: left; font-weight: 400; color: #9ca3af; border-bottom: 1px solid #e5e7eb; font-size: 11px;">Item</th>
        <th style="padding: 12px 0; text-align: center; font-weight: 400; color: #9ca3af; border-bottom: 1px solid #e5e7eb; font-size: 11px; width: 50px;">Qty</th>
        <th style="padding: 12px 0; text-align: right; font-weight: 400; color: #9ca3af; border-bottom: 1px solid #e5e7eb; font-size: 11px; width: 90px;">Rate</th>
        <th style="padding: 12px 0; text-align: right; font-weight: 400; color: #9ca3af; border-bottom: 1px solid #e5e7eb; font-size: 11px; width: 100px;">Total</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td style="padding: 14px 0; border-bottom: 1px solid #f3f4f6;">{{description}}</td>
        <td style="padding: 14px 0; border-bottom: 1px solid #f3f4f6; text-align: center;">{{quantity}}</td>
        <td style="padding: 14px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">{{rate}}</td>
        <td style="padding: 14px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600;">{{lineTotal}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <table style="width: 200px; margin-left: auto; font-size: 12px; margin-bottom: 40px;">
    <tr><td style="padding: 4px 0; color: #9ca3af;">Subtotal</td><td style="text-align: right;">{{subtotal}}</td></tr>
    {{#if hasDiscount}}<tr><td style="padding: 4px 0; color: #9ca3af;">Discount</td><td style="text-align: right;">-{{discountAmount}}</td></tr>{{/if}}
    {{#if hasTax}}<tr><td style="padding: 4px 0; color: #9ca3af;">Tax</td><td style="text-align: right;">{{taxAmount}}</td></tr>{{/if}}
    <tr><td colspan="2" style="border-top: 1px solid #e5e7eb; padding-top: 8px;"></td></tr>
    <tr><td style="font-size: 14px; font-weight: 700; color: #111827;">Total</td><td style="text-align: right; font-size: 14px; font-weight: 700; color: #111827;">{{total}} {{currency}}</td></tr>
  </table>

  {{#if hasBank}}
  <div style="font-size: 11px; color: #9ca3af; margin-bottom: 16px;">
    <span style="font-weight: 600;">Pay to:</span> {{bankName}} &middot; {{bankIban}}
  </div>
  {{/if}}

  {{#if hasNotes}}<div style="font-size: 11px; color: #6b7280; margin-bottom: 16px;">{{notes}}</div>{{/if}}

  <div style="margin-top: 48px; text-align: center; font-size: 10px; color: #d1d5db;">{{brand.footerText}}</div>
</body></html>`;

/* ─── 4. Quote Professional ───────────────────────────────────────────────── */
const quoteProfessionalHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><style>${BASE_CSS}</style></head>
<body style="padding: 0; font-size: 13px;">
  <!-- Header with colored background -->
  <div style="background: {{brand.primaryColor}}; color: #fff; padding: 28px 32px; margin: -20mm -20mm 32px -20mm;">
    <table style="width: calc(100% + 0px);">
      <tr>
        <td style="vertical-align: middle;">
          <div style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">{{brand.companyName}}</div>
          <div style="font-size: 11px; opacity: 0.85; margin-top: 4px;">{{brand.companyAddress}}</div>
          <div style="font-size: 11px; opacity: 0.85;">{{brand.companyEmail}} | {{brand.companyPhone}}</div>
        </td>
        <td style="vertical-align: middle; text-align: right;">
          <div style="font-size: 14px; font-weight: 300; text-transform: uppercase; letter-spacing: 4px; opacity: 0.8;">Quotation</div>
          <div style="font-size: 22px; font-weight: 700; margin-top: 6px;">{{refNumber}}</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Dates & Client Info -->
  <table style="width: 100%; margin-bottom: 30px;">
    <tr>
      <td style="width: 50%; vertical-align: top;">
        <div style="font-size: 10px; font-weight: 700; color: {{brand.primaryColor}}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px;">Prepared For</div>
        <div style="font-size: 16px; font-weight: 700; color: #0f172a;">{{clientCompany}}</div>
        <div style="font-size: 13px; color: #475569;">{{clientName}}</div>
        <div style="font-size: 12px; color: #64748b;">{{clientEmail}}</div>
        {{#if clientAddress}}<div style="font-size: 12px; color: #64748b;">{{clientAddress}}</div>{{/if}}
      </td>
      <td style="width: 50%; vertical-align: top;">
        <table style="font-size: 12px; margin-left: auto;">
          <tr><td style="padding: 4px 12px 4px 0; color: #94a3b8; font-weight: 600;">Date:</td><td style="padding: 4px 0;">{{formattedDate}}</td></tr>
          {{#if formattedValidUntil}}<tr><td style="padding: 4px 12px 4px 0; color: #94a3b8; font-weight: 600;">Valid Until:</td><td style="padding: 4px 0;">{{formattedValidUntil}}</td></tr>{{/if}}
          {{#if formattedDueDate}}<tr><td style="padding: 4px 12px 4px 0; color: #94a3b8; font-weight: 600;">Due Date:</td><td style="padding: 4px 0;">{{formattedDueDate}}</td></tr>{{/if}}
        </table>
      </td>
    </tr>
  </table>

  <!-- Items Table -->
  <table style="width: 100%; margin-bottom: 24px; font-size: 12px;">
    <thead>
      <tr>
        <th style="padding: 12px 14px; text-align: left; font-weight: 700; background: #f8fafc; border-top: 2px solid {{brand.primaryColor}}; border-bottom: 1px solid #e2e8f0; color: #334155; width: 36px;">#</th>
        <th style="padding: 12px 14px; text-align: left; font-weight: 700; background: #f8fafc; border-top: 2px solid {{brand.primaryColor}}; border-bottom: 1px solid #e2e8f0; color: #334155;">Description</th>
        <th style="padding: 12px 14px; text-align: center; font-weight: 700; background: #f8fafc; border-top: 2px solid {{brand.primaryColor}}; border-bottom: 1px solid #e2e8f0; color: #334155; width: 60px;">Qty</th>
        <th style="padding: 12px 14px; text-align: right; font-weight: 700; background: #f8fafc; border-top: 2px solid {{brand.primaryColor}}; border-bottom: 1px solid #e2e8f0; color: #334155; width: 110px;">Unit Price</th>
        <th style="padding: 12px 14px; text-align: right; font-weight: 700; background: #f8fafc; border-top: 2px solid {{brand.primaryColor}}; border-bottom: 1px solid #e2e8f0; color: #334155; width: 120px;">Total</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9;">{{index}}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; font-weight: 600;">{{description}}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; text-align: center;">{{quantity}}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; text-align: right;">{{rate}} {{currency}}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700;">{{lineTotal}} {{currency}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <!-- Totals -->
  <table style="width: 280px; margin-left: auto; font-size: 13px; margin-bottom: 32px;">
    <tr><td style="padding: 6px 0; color: #64748b;">Subtotal</td><td style="text-align: right; font-weight: 600;">{{subtotal}} {{currency}}</td></tr>
    {{#if hasDiscount}}<tr><td style="padding: 6px 0; color: #64748b;">Discount</td><td style="text-align: right; color: #ef4444;">-{{discountAmount}} {{currency}}</td></tr>{{/if}}
    {{#if hasTax}}<tr><td style="padding: 6px 0; color: #64748b;">VAT</td><td style="text-align: right;">{{taxAmount}} {{currency}}</td></tr>{{/if}}
    <tr style="border-top: 2px solid {{brand.primaryColor}};"><td style="padding: 12px 0; font-weight: 800; font-size: 16px; color: {{brand.primaryColor}};">Grand Total</td><td style="padding: 12px 0; text-align: right; font-weight: 800; font-size: 16px; color: {{brand.primaryColor}};">{{total}} {{currency}}</td></tr>
  </table>

  {{#if hasPaymentTerms}}
  <div style="margin-bottom: 16px;">
    <div style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 4px;">Payment Terms</div>
    <div style="font-size: 11px; color: #64748b; line-height: 1.6;">{{paymentTerms}}</div>
  </div>
  {{/if}}

  {{#if hasTerms}}
  <div style="margin-bottom: 16px;">
    <div style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 4px;">Terms &amp; Conditions</div>
    <div style="font-size: 11px; color: #64748b; line-height: 1.6;">{{termsAndConditions}}</div>
  </div>
  {{/if}}

  {{#if hasNotes}}
  <div style="background: #fffbeb; border-left: 3px solid #f59e0b; padding: 10px 14px; margin-bottom: 18px;">
    <div style="font-size: 12px; color: #78350f;">{{notes}}</div>
  </div>
  {{/if}}

  <!-- Acceptance -->
  <div style="margin-top: 36px; border-top: 1px solid #e2e8f0; padding-top: 24px;">
    <table style="width: 100%;">
      <tr>
        <td style="width: 50%; padding-right: 20px;">
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 32px;">Authorized Signature</div>
          <div style="border-bottom: 1px solid #cbd5e1; width: 80%;"></div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 6px;">{{brand.companyName}}</div>
        </td>
        <td style="width: 50%; padding-left: 20px;">
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 32px;">Client Acceptance</div>
          <div style="border-bottom: 1px solid #cbd5e1; width: 80%;"></div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 6px;">Date: _______________</div>
        </td>
      </tr>
    </table>
  </div>

  <div style="margin-top: 28px; text-align: center; font-size: 10px; color: #94a3b8;">{{brand.footerText}}</div>
</body></html>`;

/* ─── 5. Quote Simple ─────────────────────────────────────────────────────── */
const quoteSimpleHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><style>${BASE_CSS}</style></head>
<body style="padding: 0; font-size: 13px;">
  <div style="margin-bottom: 32px;">
    <div style="font-size: 20px; font-weight: 700; color: #111827;">{{brand.companyName}}</div>
    <div style="font-size: 11px; color: #9ca3af;">{{brand.companyAddress}} &middot; {{brand.companyEmail}}</div>
  </div>

  <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 28px; border-bottom: 2px solid {{brand.primaryColor}}; padding-bottom: 12px;">
    <div style="font-size: 24px; font-weight: 300; color: {{brand.primaryColor}}; text-transform: uppercase;">Quote</div>
    <div style="text-align: right;">
      <div style="font-size: 14px; font-weight: 600;">{{refNumber}}</div>
      <div style="font-size: 11px; color: #6b7280;">{{formattedDate}}{{#if formattedValidUntil}} &middot; Valid until {{formattedValidUntil}}{{/if}}</div>
    </div>
  </div>

  <div style="background: #f9fafb; padding: 16px; border-radius: 6px; margin-bottom: 28px;">
    <div style="font-size: 14px; font-weight: 600; color: #111827;">{{clientCompany}}</div>
    <div style="font-size: 12px; color: #6b7280;">{{clientName}} &middot; {{clientEmail}}</div>
  </div>

  <table style="width: 100%; margin-bottom: 24px; font-size: 12px;">
    <thead>
      <tr style="border-bottom: 1px solid #d1d5db;">
        <th style="padding: 8px 0; text-align: left; font-weight: 600; color: #374151;">Item</th>
        <th style="padding: 8px 0; text-align: center; font-weight: 600; color: #374151; width: 50px;">Qty</th>
        <th style="padding: 8px 0; text-align: right; font-weight: 600; color: #374151; width: 90px;">Price</th>
        <th style="padding: 8px 0; text-align: right; font-weight: 600; color: #374151; width: 100px;">Total</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">{{description}}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; text-align: center;">{{quantity}}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">{{rate}}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600;">{{lineTotal}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <table style="width: 200px; margin-left: auto; font-size: 12px; margin-bottom: 32px;">
    <tr><td style="padding: 4px 0; color: #6b7280;">Subtotal</td><td style="text-align: right;">{{subtotal}}</td></tr>
    {{#if hasDiscount}}<tr><td style="padding: 4px 0; color: #6b7280;">Discount</td><td style="text-align: right;">-{{discountAmount}}</td></tr>{{/if}}
    {{#if hasTax}}<tr><td style="padding: 4px 0; color: #6b7280;">Tax</td><td style="text-align: right;">{{taxAmount}}</td></tr>{{/if}}
    <tr style="border-top: 2px solid {{brand.primaryColor}};"><td style="padding: 8px 0; font-weight: 700; color: {{brand.primaryColor}};">Total</td><td style="text-align: right; font-weight: 700; color: {{brand.primaryColor}};">{{total}} {{currency}}</td></tr>
  </table>

  {{#if hasNotes}}<div style="font-size: 11px; color: #6b7280; margin-bottom: 16px; padding: 10px; background: #fefce8; border-radius: 4px;">{{notes}}</div>{{/if}}

  <div style="margin-top: 36px; text-align: center; font-size: 10px; color: #d1d5db;">{{brand.footerText}}</div>
</body></html>`;

/* ─── 6. Contract Legal ───────────────────────────────────────────────────── */
const contractLegalHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><style>${BASE_CSS}
body { font-size: 12px; line-height: 1.7; }
</style></head>
<body style="padding: 0;">
  <!-- Header -->
  <div style="text-align: center; margin-bottom: 32px; border-bottom: 2px solid #1e293b; padding-bottom: 20px;">
    <div style="font-size: 22px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 1px;">{{brand.companyName}}</div>
    <div style="font-size: 11px; color: #64748b; margin-top: 4px;">{{brand.companyAddress}} | {{brand.companyEmail}} | {{brand.companyPhone}}</div>
    <div style="margin-top: 16px; font-size: 20px; font-weight: 700; color: {{brand.primaryColor}}; text-transform: uppercase; letter-spacing: 3px;">Service Agreement</div>
    <div style="font-size: 13px; color: #475569; margin-top: 4px;">Contract No. {{refNumber}}</div>
  </div>

  <!-- Parties -->
  <div style="margin-bottom: 24px;">
    <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Parties to this Agreement</div>
    <div style="margin-bottom: 10px;">
      <span style="font-weight: 700;">Provider:</span> {{brand.companyName}}, located at {{brand.companyAddress}}
      {{#if brand.companyTaxId}}(VAT: {{brand.companyTaxId}}){{/if}}, hereinafter referred to as "the Provider".
    </div>
    <div>
      <span style="font-weight: 700;">Client:</span> {{clientCompany}}, represented by {{clientName}}
      ({{clientEmail}}){{#if clientAddress}}, located at {{clientAddress}}{{/if}}{{#if clientTaxId}} (VAT: {{clientTaxId}}){{/if}}, hereinafter referred to as "the Client".
    </div>
  </div>

  <!-- Effective Date -->
  <div style="margin-bottom: 20px;">
    <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 6px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Effective Date</div>
    <div>This agreement is effective as of <strong>{{formattedDate}}</strong>{{#if formattedDueDate}} and shall remain in force until <strong>{{formattedDueDate}}</strong>{{/if}}.</div>
  </div>

  <!-- Scope of Services -->
  <div style="margin-bottom: 20px;">
    <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 6px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Scope of Services</div>
    <div style="margin-bottom: 8px;">The Provider agrees to deliver the following services to the Client:</div>
    <table style="width: 100%; margin-bottom: 12px; font-size: 12px;">
      <thead>
        <tr style="background: #f1f5f9;">
          <th style="padding: 8px 12px; text-align: left; border: 1px solid #e2e8f0;">#</th>
          <th style="padding: 8px 12px; text-align: left; border: 1px solid #e2e8f0;">Description</th>
          <th style="padding: 8px 12px; text-align: center; border: 1px solid #e2e8f0; width: 50px;">Qty</th>
          <th style="padding: 8px 12px; text-align: right; border: 1px solid #e2e8f0; width: 100px;">Rate</th>
          <th style="padding: 8px 12px; text-align: right; border: 1px solid #e2e8f0; width: 110px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        {{#each items}}
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">{{index}}</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">{{description}}</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center;">{{quantity}}</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: right;">{{rate}}</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600;">{{lineTotal}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>

  <!-- Financial Terms -->
  <div style="margin-bottom: 20px;">
    <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 6px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Financial Terms</div>
    <table style="width: 260px; font-size: 12px;">
      <tr><td style="padding: 4px 0;">Subtotal:</td><td style="text-align: right; font-weight: 600;">{{subtotal}} {{currency}}</td></tr>
      {{#if hasDiscount}}<tr><td style="padding: 4px 0;">Discount:</td><td style="text-align: right;">-{{discountAmount}} {{currency}}</td></tr>{{/if}}
      {{#if hasTax}}<tr><td style="padding: 4px 0;">Tax:</td><td style="text-align: right;">{{taxAmount}} {{currency}}</td></tr>{{/if}}
      <tr style="border-top: 1px solid #1e293b;"><td style="padding: 6px 0; font-weight: 800;">Total Contract Value:</td><td style="text-align: right; font-weight: 800;">{{total}} {{currency}}</td></tr>
    </table>
  </div>

  {{#if hasPaymentTerms}}
  <div style="margin-bottom: 20px;">
    <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 6px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Payment Terms</div>
    <div>{{paymentTerms}}</div>
  </div>
  {{/if}}

  {{#if hasBank}}
  <div style="margin-bottom: 20px;">
    <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 6px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Bank Details</div>
    <div>Bank: {{bankName}} | Account: {{bankAccountName}} | IBAN: {{bankIban}}{{#if bankSwift}} | SWIFT: {{bankSwift}}{{/if}}</div>
  </div>
  {{/if}}

  {{#if hasTerms}}
  <div style="margin-bottom: 20px;">
    <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 6px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Terms &amp; Conditions</div>
    <div>{{termsAndConditions}}</div>
  </div>
  {{/if}}

  {{#if hasNotes}}
  <div style="margin-bottom: 20px;">
    <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Additional Notes</div>
    <div>{{notes}}</div>
  </div>
  {{/if}}

  <!-- Signatures -->
  <div style="margin-top: 40px; page-break-inside: avoid;">
    <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 20px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Signatures</div>
    <table style="width: 100%;">
      <tr>
        <td style="width: 45%; vertical-align: top;">
          <div style="font-size: 12px; font-weight: 600; margin-bottom: 40px;">For the Provider:</div>
          <div style="border-bottom: 1px solid #334155; width: 90%; margin-bottom: 6px;"></div>
          <div style="font-size: 11px; color: #64748b;">Name: ________________________</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Date: ________________________</div>
        </td>
        <td style="width: 10%;"></td>
        <td style="width: 45%; vertical-align: top;">
          <div style="font-size: 12px; font-weight: 600; margin-bottom: 40px;">For the Client:</div>
          <div style="border-bottom: 1px solid #334155; width: 90%; margin-bottom: 6px;"></div>
          <div style="font-size: 11px; color: #64748b;">Name: ________________________</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Date: ________________________</div>
        </td>
      </tr>
    </table>
  </div>

  <div style="margin-top: 32px; text-align: center; font-size: 10px; color: #94a3b8;">{{brand.footerText}}</div>
</body></html>`;

/* ─── 7. Contract Compact ─────────────────────────────────────────────────── */
const contractCompactHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><style>${BASE_CSS}</style></head>
<body style="padding: 0; font-size: 12px;">
  <!-- Header -->
  <table style="width: 100%; margin-bottom: 24px;">
    <tr>
      <td style="vertical-align: top;">
        <div style="font-size: 18px; font-weight: 700; color: {{brand.primaryColor}};">{{brand.companyName}}</div>
        <div style="font-size: 10px; color: #64748b;">{{brand.companyAddress}}</div>
      </td>
      <td style="vertical-align: top; text-align: right;">
        <div style="display: inline-block; background: {{brand.primaryColor}}; color: #fff; padding: 6px 16px; border-radius: 4px; font-size: 12px; font-weight: 700; text-transform: uppercase;">Contract</div>
        <div style="font-size: 13px; font-weight: 600; margin-top: 6px;">{{refNumber}}</div>
      </td>
    </tr>
  </table>

  <div style="background: #f8fafc; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
    <table style="width: 100%; font-size: 12px;">
      <tr>
        <td style="width: 50%; vertical-align: top;">
          <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; margin-bottom: 4px;">Provider</div>
          <div style="font-weight: 600;">{{brand.companyName}}</div>
          <div style="color: #64748b;">{{brand.companyEmail}}</div>
        </td>
        <td style="width: 50%; vertical-align: top;">
          <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; margin-bottom: 4px;">Client</div>
          <div style="font-weight: 600;">{{clientCompany}}</div>
          <div style="color: #64748b;">{{clientName}} &middot; {{clientEmail}}</div>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding-top: 10px;">
          <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px;">Effective:</span>
          <span style="color: #334155; font-weight: 600;">{{formattedDate}}</span>
          {{#if formattedDueDate}}<span style="color: #94a3b8;"> to </span><span style="color: #334155; font-weight: 600;">{{formattedDueDate}}</span>{{/if}}
        </td>
      </tr>
    </table>
  </div>

  <!-- Deliverables -->
  <div style="font-size: 12px; font-weight: 700; color: {{brand.primaryColor}}; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Deliverables</div>
  <table style="width: 100%; margin-bottom: 20px; font-size: 12px;">
    <thead>
      <tr style="border-bottom: 2px solid {{brand.primaryColor}};">
        <th style="padding: 8px 10px; text-align: left; font-weight: 600;">Description</th>
        <th style="padding: 8px 10px; text-align: center; font-weight: 600; width: 50px;">Qty</th>
        <th style="padding: 8px 10px; text-align: right; font-weight: 600; width: 90px;">Rate</th>
        <th style="padding: 8px 10px; text-align: right; font-weight: 600; width: 100px;">Total</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9;">{{description}}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-align: center;">{{quantity}}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-align: right;">{{rate}}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">{{lineTotal}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <table style="width: 220px; margin-left: auto; font-size: 12px; margin-bottom: 24px;">
    <tr><td style="padding: 3px 0; color: #64748b;">Subtotal</td><td style="text-align: right;">{{subtotal}} {{currency}}</td></tr>
    {{#if hasDiscount}}<tr><td style="padding: 3px 0; color: #64748b;">Discount</td><td style="text-align: right; color: #ef4444;">-{{discountAmount}} {{currency}}</td></tr>{{/if}}
    {{#if hasTax}}<tr><td style="padding: 3px 0; color: #64748b;">Tax</td><td style="text-align: right;">{{taxAmount}} {{currency}}</td></tr>{{/if}}
    <tr style="border-top: 2px solid {{brand.primaryColor}};"><td style="padding: 8px 0; font-weight: 700; color: {{brand.primaryColor}};">Total</td><td style="text-align: right; font-weight: 700; color: {{brand.primaryColor}};">{{total}} {{currency}}</td></tr>
  </table>

  {{#if hasPaymentTerms}}<div style="margin-bottom: 12px;"><span style="font-weight: 700; font-size: 11px; color: #334155;">Payment Terms:</span> <span style="font-size: 11px; color: #64748b;">{{paymentTerms}}</span></div>{{/if}}
  {{#if hasTerms}}<div style="margin-bottom: 12px;"><span style="font-weight: 700; font-size: 11px; color: #334155;">Terms:</span> <span style="font-size: 11px; color: #64748b;">{{termsAndConditions}}</span></div>{{/if}}
  {{#if hasNotes}}<div style="margin-bottom: 12px; padding: 8px; background: #fffbeb; border-radius: 4px; font-size: 11px; color: #78350f;">{{notes}}</div>{{/if}}

  {{#if hasBank}}
  <div style="font-size: 11px; color: #64748b; margin-bottom: 16px;">
    <span style="font-weight: 600; color: #334155;">Bank:</span> {{bankName}} | IBAN: {{bankIban}}
  </div>
  {{/if}}

  <!-- Signatures -->
  <table style="width: 100%; margin-top: 30px;">
    <tr>
      <td style="width: 48%; border-top: 1px solid #cbd5e1; padding-top: 8px;">
        <div style="font-size: 10px; color: #94a3b8;">Provider Signature &amp; Date</div>
      </td>
      <td style="width: 4%;"></td>
      <td style="width: 48%; border-top: 1px solid #cbd5e1; padding-top: 8px;">
        <div style="font-size: 10px; color: #94a3b8;">Client Signature &amp; Date</div>
      </td>
    </tr>
  </table>

  <div style="margin-top: 24px; text-align: center; font-size: 10px; color: #94a3b8;">{{brand.footerText}}</div>
</body></html>`;

/* ─── 8. Purchase Order ───────────────────────────────────────────────────── */
const purchaseOrderHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><style>${BASE_CSS}</style></head>
<body style="padding: 0; font-size: 13px;">
  <!-- Header -->
  <table style="width: 100%; margin-bottom: 24px; border-bottom: 3px solid {{brand.primaryColor}}; padding-bottom: 16px;">
    <tr>
      <td style="vertical-align: top; width: 55%;">
        <div style="font-size: 20px; font-weight: 800; color: {{brand.primaryColor}};">{{brand.companyName}}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">{{brand.companyAddress}}</div>
        <div style="font-size: 11px; color: #64748b;">{{brand.companyEmail}} | {{brand.companyPhone}}</div>
        {{#if brand.companyTaxId}}<div style="font-size: 10px; color: #94a3b8;">VAT: {{brand.companyTaxId}}</div>{{/if}}
      </td>
      <td style="vertical-align: top; text-align: right;">
        <div style="background: {{brand.primaryColor}}; color: #fff; display: inline-block; padding: 8px 20px; font-size: 16px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">Purchase Order</div>
        <div style="font-size: 14px; font-weight: 700; color: #334155; margin-top: 8px;">{{refNumber}}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Date: {{formattedDate}}</div>
        {{#if formattedDueDate}}<div style="font-size: 12px; color: #64748b;">Delivery By: {{formattedDueDate}}</div>{{/if}}
      </td>
    </tr>
  </table>

  <!-- Vendor & Ship To -->
  <table style="width: 100%; margin-bottom: 28px;">
    <tr>
      <td style="width: 50%; vertical-align: top; padding-right: 16px;">
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 14px;">
          <div style="font-size: 10px; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Vendor</div>
          <div style="font-size: 14px; font-weight: 700; color: #0f172a;">{{clientCompany}}</div>
          <div style="font-size: 12px; color: #475569;">{{clientName}}</div>
          <div style="font-size: 12px; color: #64748b;">{{clientEmail}}</div>
          {{#if clientAddress}}<div style="font-size: 12px; color: #64748b;">{{clientAddress}}</div>{{/if}}
          {{#if clientTaxId}}<div style="font-size: 11px; color: #94a3b8;">VAT: {{clientTaxId}}</div>{{/if}}
        </div>
      </td>
      <td style="width: 50%; vertical-align: top; padding-left: 16px;">
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 14px;">
          <div style="font-size: 10px; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Ship To</div>
          <div style="font-size: 14px; font-weight: 700; color: #0f172a;">{{brand.companyName}}</div>
          <div style="font-size: 12px; color: #64748b;">{{brand.companyAddress}}</div>
        </div>
      </td>
    </tr>
  </table>

  <!-- Items -->
  <table style="width: 100%; margin-bottom: 24px; font-size: 12px;">
    <thead>
      <tr style="background: {{brand.primaryColor}}; color: #fff;">
        <th style="padding: 10px 12px; text-align: left; font-weight: 600; width: 36px;">#</th>
        <th style="padding: 10px 12px; text-align: left; font-weight: 600;">Item Description</th>
        <th style="padding: 10px 12px; text-align: center; font-weight: 600; width: 60px;">Qty</th>
        <th style="padding: 10px 12px; text-align: right; font-weight: 600; width: 100px;">Unit Price</th>
        <th style="padding: 10px 12px; text-align: right; font-weight: 600; width: 120px;">Total</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">{{index}}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">{{description}}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">{{quantity}}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">{{rate}}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700;">{{lineTotal}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <!-- Totals -->
  <table style="width: 260px; margin-left: auto; font-size: 13px; margin-bottom: 28px;">
    <tr><td style="padding: 5px 0; color: #64748b;">Subtotal</td><td style="text-align: right;">{{subtotal}} {{currency}}</td></tr>
    {{#if hasDiscount}}<tr><td style="padding: 5px 0; color: #64748b;">Discount</td><td style="text-align: right; color: #ef4444;">-{{discountAmount}} {{currency}}</td></tr>{{/if}}
    {{#if hasTax}}<tr><td style="padding: 5px 0; color: #64748b;">Tax</td><td style="text-align: right;">{{taxAmount}} {{currency}}</td></tr>{{/if}}
    <tr style="border-top: 2px solid {{brand.primaryColor}};"><td style="padding: 10px 0; font-weight: 800; color: {{brand.primaryColor}};">Total</td><td style="padding: 10px 0; text-align: right; font-weight: 800; color: {{brand.primaryColor}};">{{total}} {{currency}}</td></tr>
  </table>

  {{#if hasPaymentTerms}}<div style="margin-bottom: 12px;"><div style="font-size: 11px; font-weight: 700; color: #334155; margin-bottom: 2px;">Payment Terms</div><div style="font-size: 11px; color: #64748b;">{{paymentTerms}}</div></div>{{/if}}
  {{#if hasNotes}}<div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 4px; padding: 10px; margin-bottom: 14px; font-size: 11px; color: #78350f;">{{notes}}</div>{{/if}}

  <!-- Authorization -->
  <table style="width: 100%; margin-top: 32px;">
    <tr>
      <td style="width: 48%;">
        <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 36px;">Authorized By</div>
        <div style="border-bottom: 1px solid #cbd5e1; width: 85%;"></div>
        <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Signature &amp; Date</div>
      </td>
      <td style="width: 4%;"></td>
      <td style="width: 48%;">
        <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 36px;">Vendor Acknowledgment</div>
        <div style="border-bottom: 1px solid #cbd5e1; width: 85%;"></div>
        <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Signature &amp; Date</div>
      </td>
    </tr>
  </table>

  <div style="margin-top: 28px; text-align: center; font-size: 10px; color: #94a3b8;">{{brand.footerText}}</div>
</body></html>`;

/* ─── 9. Sales Order ──────────────────────────────────────────────────────── */
const salesOrderHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><style>${BASE_CSS}</style></head>
<body style="padding: 0; font-size: 13px;">
  <!-- Top stripe -->
  <div style="height: 4px; background: {{brand.primaryColor}}; margin-bottom: 28px;"></div>

  <table style="width: 100%; margin-bottom: 28px;">
    <tr>
      <td style="vertical-align: top;">
        <div style="font-size: 20px; font-weight: 800; color: #0f172a;">{{brand.companyName}}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">{{brand.companyAddress}}<br>{{brand.companyEmail}} | {{brand.companyPhone}}</div>
      </td>
      <td style="vertical-align: top; text-align: right;">
        <div style="font-size: 22px; font-weight: 300; color: {{brand.primaryColor}}; text-transform: uppercase; letter-spacing: 2px;">Sales Order</div>
        <div style="font-size: 14px; font-weight: 600; margin-top: 6px;">{{refNumber}}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Order Date: {{formattedDate}}</div>
        {{#if formattedDueDate}}<div style="font-size: 11px; color: #64748b;">Expected Delivery: {{formattedDueDate}}</div>{{/if}}
      </td>
    </tr>
  </table>

  <!-- Customer -->
  <div style="background: #f8fafc; border-left: 4px solid {{brand.primaryColor}}; padding: 14px 16px; margin-bottom: 28px;">
    <div style="font-size: 10px; font-weight: 700; color: {{brand.primaryColor}}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Customer</div>
    <div style="font-size: 14px; font-weight: 700; color: #0f172a;">{{clientCompany}}</div>
    <div style="font-size: 12px; color: #475569;">{{clientName}} &middot; {{clientEmail}}</div>
    {{#if clientAddress}}<div style="font-size: 12px; color: #64748b;">{{clientAddress}}</div>{{/if}}
  </div>

  <!-- Order Items -->
  <table style="width: 100%; margin-bottom: 24px; font-size: 12px;">
    <thead>
      <tr style="background: #f1f5f9; border-bottom: 2px solid {{brand.primaryColor}};">
        <th style="padding: 10px 12px; text-align: left; font-weight: 700; width: 36px;">#</th>
        <th style="padding: 10px 12px; text-align: left; font-weight: 700;">Product / Service</th>
        <th style="padding: 10px 12px; text-align: center; font-weight: 700; width: 55px;">Qty</th>
        <th style="padding: 10px 12px; text-align: right; font-weight: 700; width: 100px;">Price</th>
        <th style="padding: 10px 12px; text-align: right; font-weight: 700; width: 110px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9;">{{index}}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-weight: 600;">{{description}}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: center;">{{quantity}}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: right;">{{rate}}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700;">{{lineTotal}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <table style="width: 250px; margin-left: auto; font-size: 13px; margin-bottom: 28px;">
    <tr><td style="padding: 5px 0; color: #64748b;">Subtotal</td><td style="text-align: right;">{{subtotal}} {{currency}}</td></tr>
    {{#if hasDiscount}}<tr><td style="padding: 5px 0; color: #64748b;">Discount</td><td style="text-align: right; color: #ef4444;">-{{discountAmount}} {{currency}}</td></tr>{{/if}}
    {{#if hasTax}}<tr><td style="padding: 5px 0; color: #64748b;">Tax</td><td style="text-align: right;">{{taxAmount}} {{currency}}</td></tr>{{/if}}
    <tr style="border-top: 2px solid {{brand.primaryColor}};"><td style="padding: 10px 0; font-weight: 800; color: {{brand.primaryColor}};">Order Total</td><td style="padding: 10px 0; text-align: right; font-weight: 800; color: {{brand.primaryColor}};">{{total}} {{currency}}</td></tr>
  </table>

  {{#if hasPaymentTerms}}<div style="margin-bottom: 12px;"><div style="font-size: 11px; font-weight: 700; color: #334155;">Payment Terms</div><div style="font-size: 11px; color: #64748b;">{{paymentTerms}}</div></div>{{/if}}
  {{#if hasBank}}<div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 4px; padding: 10px; margin-bottom: 14px; font-size: 11px; color: #0c4a6e;">Bank: {{bankName}} | IBAN: {{bankIban}} {{#if bankSwift}}| SWIFT: {{bankSwift}}{{/if}}</div>{{/if}}
  {{#if hasNotes}}<div style="background: #fffbeb; border-radius: 4px; padding: 10px; margin-bottom: 14px; font-size: 11px; color: #78350f;">{{notes}}</div>{{/if}}

  <div style="margin-top: 36px; text-align: center; font-size: 10px; color: #94a3b8;">{{brand.footerText}}</div>
</body></html>`;

/* ─── 10. Delivery Note ───────────────────────────────────────────────────── */
const deliveryNoteHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><style>${BASE_CSS}</style></head>
<body style="padding: 0; font-size: 13px;">
  <!-- Header -->
  <table style="width: 100%; margin-bottom: 24px;">
    <tr>
      <td style="vertical-align: top; width: 55%;">
        <div style="font-size: 20px; font-weight: 800; color: {{brand.primaryColor}};">{{brand.companyName}}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">{{brand.companyAddress}}</div>
        <div style="font-size: 11px; color: #64748b;">{{brand.companyEmail}} | {{brand.companyPhone}}</div>
      </td>
      <td style="vertical-align: top; text-align: right;">
        <div style="font-size: 24px; font-weight: 800; color: #0f172a; text-transform: uppercase;">Delivery Note</div>
        <div style="height: 3px; background: {{brand.primaryColor}}; margin-top: 6px;"></div>
      </td>
    </tr>
  </table>

  <!-- Document Info -->
  <table style="width: 100%; margin-bottom: 24px; font-size: 12px;">
    <tr>
      <td style="width: 50%; vertical-align: top;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px;">
          <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Deliver To</div>
          <div style="font-size: 14px; font-weight: 700; color: #0f172a;">{{clientCompany}}</div>
          <div style="color: #475569;">{{clientName}}</div>
          {{#if clientAddress}}<div style="color: #64748b;">{{clientAddress}}</div>{{/if}}
          <div style="color: #64748b;">{{clientEmail}}</div>
        </div>
      </td>
      <td style="width: 50%; vertical-align: top; padding-left: 16px;">
        <table style="font-size: 12px; width: 100%;">
          <tr><td style="padding: 5px 0; color: #94a3b8; font-weight: 600; width: 40%;">DN Number:</td><td style="padding: 5px 0; font-weight: 700;">{{refNumber}}</td></tr>
          <tr><td style="padding: 5px 0; color: #94a3b8; font-weight: 600;">Date:</td><td style="padding: 5px 0;">{{formattedDate}}</td></tr>
          {{#if formattedDueDate}}<tr><td style="padding: 5px 0; color: #94a3b8; font-weight: 600;">Expected:</td><td style="padding: 5px 0;">{{formattedDueDate}}</td></tr>{{/if}}
        </table>
      </td>
    </tr>
  </table>

  <!-- Items -->
  <table style="width: 100%; margin-bottom: 24px; font-size: 12px;">
    <thead>
      <tr style="background: #f1f5f9; border-bottom: 2px solid {{brand.primaryColor}};">
        <th style="padding: 10px 12px; text-align: left; font-weight: 700; width: 36px;">#</th>
        <th style="padding: 10px 12px; text-align: left; font-weight: 700;">Item Description</th>
        <th style="padding: 10px 12px; text-align: center; font-weight: 700; width: 80px;">Quantity</th>
        <th style="padding: 10px 12px; text-align: center; font-weight: 700; width: 100px;">Received</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">{{index}}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">{{description}}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">{{quantity}}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #94a3b8;">________</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  {{#if hasNotes}}
  <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 4px; padding: 10px; margin-bottom: 18px; font-size: 11px; color: #78350f;">
    <span style="font-weight: 700;">Notes:</span> {{notes}}
  </div>
  {{/if}}

  <!-- Acknowledgment -->
  <div style="margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
    <div style="font-size: 11px; font-weight: 700; color: #334155; margin-bottom: 8px;">Delivery Acknowledgment</div>
    <table style="width: 100%; font-size: 11px;">
      <tr>
        <td style="width: 50%; padding-top: 30px; border-bottom: 1px solid #cbd5e1;">
          <div style="color: #94a3b8;">Received by (Name &amp; Signature)</div>
        </td>
        <td style="width: 10%;"></td>
        <td style="width: 40%; padding-top: 30px; border-bottom: 1px solid #cbd5e1;">
          <div style="color: #94a3b8;">Date &amp; Time</div>
        </td>
      </tr>
    </table>
  </div>

  <div style="margin-top: 28px; text-align: center; font-size: 10px; color: #94a3b8;">{{brand.footerText}}</div>
</body></html>`;

/* ─── 11. Credit Note ─────────────────────────────────────────────────────── */
const creditNoteHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><style>${BASE_CSS}</style></head>
<body style="padding: 0; font-size: 13px;">
  <!-- Header -->
  <table style="width: 100%; margin-bottom: 28px; border-bottom: 3px solid #dc2626; padding-bottom: 16px;">
    <tr>
      <td style="vertical-align: top;">
        <div style="font-size: 20px; font-weight: 800; color: {{brand.primaryColor}};">{{brand.companyName}}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">{{brand.companyAddress}}</div>
        <div style="font-size: 11px; color: #64748b;">{{brand.companyEmail}} | {{brand.companyPhone}}</div>
        {{#if brand.companyTaxId}}<div style="font-size: 10px; color: #94a3b8;">VAT: {{brand.companyTaxId}}</div>{{/if}}
      </td>
      <td style="vertical-align: top; text-align: right;">
        <div style="font-size: 26px; font-weight: 800; color: #dc2626; text-transform: uppercase;">Credit Note</div>
        <div style="font-size: 14px; font-weight: 700; color: #334155; margin-top: 6px;">{{refNumber}}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Date: {{formattedDate}}</div>
      </td>
    </tr>
  </table>

  <!-- Credited To -->
  <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin-bottom: 28px;">
    <div style="font-size: 10px; font-weight: 700; color: #dc2626; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Credited To</div>
    <div style="font-size: 15px; font-weight: 700; color: #0f172a;">{{clientCompany}}</div>
    <div style="font-size: 13px; color: #475569;">{{clientName}}</div>
    <div style="font-size: 12px; color: #64748b;">{{clientEmail}}</div>
    {{#if clientAddress}}<div style="font-size: 12px; color: #64748b;">{{clientAddress}}</div>{{/if}}
    {{#if clientTaxId}}<div style="font-size: 11px; color: #94a3b8;">VAT: {{clientTaxId}}</div>{{/if}}
  </div>

  <!-- Credit Items -->
  <table style="width: 100%; margin-bottom: 24px; font-size: 12px;">
    <thead>
      <tr style="background: #fef2f2; border-bottom: 2px solid #dc2626;">
        <th style="padding: 10px 12px; text-align: left; font-weight: 700; color: #991b1b; width: 36px;">#</th>
        <th style="padding: 10px 12px; text-align: left; font-weight: 700; color: #991b1b;">Description</th>
        <th style="padding: 10px 12px; text-align: center; font-weight: 700; color: #991b1b; width: 60px;">Qty</th>
        <th style="padding: 10px 12px; text-align: right; font-weight: 700; color: #991b1b; width: 100px;">Rate</th>
        <th style="padding: 10px 12px; text-align: right; font-weight: 700; color: #991b1b; width: 120px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #fecaca;">{{index}}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #fecaca; font-weight: 600;">{{description}}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #fecaca; text-align: center;">{{quantity}}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #fecaca; text-align: right;">{{rate}}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #fecaca; text-align: right; font-weight: 700;">{{lineTotal}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <!-- Totals -->
  <table style="width: 260px; margin-left: auto; font-size: 13px; margin-bottom: 28px;">
    <tr><td style="padding: 5px 0; color: #64748b;">Subtotal</td><td style="text-align: right;">{{subtotal}} {{currency}}</td></tr>
    {{#if hasDiscount}}<tr><td style="padding: 5px 0; color: #64748b;">Discount</td><td style="text-align: right;">-{{discountAmount}} {{currency}}</td></tr>{{/if}}
    {{#if hasTax}}<tr><td style="padding: 5px 0; color: #64748b;">Tax</td><td style="text-align: right;">{{taxAmount}} {{currency}}</td></tr>{{/if}}
    <tr style="border-top: 2px solid #dc2626;"><td style="padding: 10px 0; font-weight: 800; font-size: 15px; color: #dc2626;">Credit Total</td><td style="padding: 10px 0; text-align: right; font-weight: 800; font-size: 15px; color: #dc2626;">{{total}} {{currency}}</td></tr>
  </table>

  {{#if hasBank}}
  <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 4px; padding: 10px; margin-bottom: 14px; font-size: 11px; color: #0c4a6e;">
    <span style="font-weight: 600;">Refund to:</span> {{bankName}} | IBAN: {{bankIban}} {{#if bankSwift}}| SWIFT: {{bankSwift}}{{/if}}
  </div>
  {{/if}}

  {{#if hasNotes}}<div style="background: #fffbeb; border-radius: 4px; padding: 10px; margin-bottom: 14px; font-size: 11px; color: #78350f;">{{notes}}</div>{{/if}}

  <div style="margin-top: 36px; text-align: center; font-size: 10px; color: #94a3b8;">{{brand.footerText}}</div>
</body></html>`;

/* ─── 12. Proforma Invoice ────────────────────────────────────────────────── */
const proformaInvoiceHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><style>${BASE_CSS}</style></head>
<body style="padding: 0; font-size: 13px;">
  <!-- Header -->
  <table style="width: 100%; margin-bottom: 28px;">
    <tr>
      <td style="vertical-align: top; width: 55%;">
        <div style="font-size: 22px; font-weight: 800; color: {{brand.primaryColor}};">{{brand.companyName}}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">{{brand.companyAddress}}</div>
        <div style="font-size: 11px; color: #64748b;">{{brand.companyEmail}} | {{brand.companyPhone}}</div>
        {{#if brand.companyTaxId}}<div style="font-size: 10px; color: #94a3b8;">VAT: {{brand.companyTaxId}}</div>{{/if}}
      </td>
      <td style="vertical-align: top; text-align: right;">
        <div style="font-size: 13px; font-weight: 600; color: {{brand.primaryColor}}; text-transform: uppercase; letter-spacing: 3px;">Proforma</div>
        <div style="font-size: 28px; font-weight: 900; color: #0f172a; margin-top: 2px;">INVOICE</div>
        <div style="height: 3px; background: {{brand.primaryColor}}; margin-top: 8px;"></div>
        <div style="font-size: 13px; font-weight: 700; color: #334155; margin-top: 8px;">{{refNumber}}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Date: {{formattedDate}}</div>
        {{#if formattedValidUntil}}<div style="font-size: 11px; color: #64748b;">Valid Until: {{formattedValidUntil}}</div>{{/if}}
      </td>
    </tr>
  </table>

  <!-- Watermark-style notice -->
  <div style="background: #fefce8; border: 1px solid #fde68a; border-radius: 6px; padding: 10px 16px; margin-bottom: 24px; text-align: center;">
    <div style="font-size: 11px; font-weight: 700; color: #92400e;">This is a proforma invoice and is not a demand for payment. It serves as an estimate for your review.</div>
  </div>

  <!-- Bill To -->
  <table style="width: 100%; margin-bottom: 28px;">
    <tr>
      <td style="width: 50%; vertical-align: top;">
        <div style="border-left: 3px solid {{brand.primaryColor}}; padding-left: 12px;">
          <div style="font-size: 10px; font-weight: 700; color: {{brand.primaryColor}}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Bill To</div>
          <div style="font-size: 15px; font-weight: 700; color: #0f172a;">{{clientCompany}}</div>
          <div style="font-size: 12px; color: #475569;">{{clientName}}</div>
          <div style="font-size: 12px; color: #64748b;">{{clientEmail}}</div>
          {{#if clientAddress}}<div style="font-size: 12px; color: #64748b;">{{clientAddress}}</div>{{/if}}
          {{#if clientTaxId}}<div style="font-size: 11px; color: #94a3b8;">VAT: {{clientTaxId}}</div>{{/if}}
        </div>
      </td>
      <td style="width: 50%; vertical-align: top;">
        {{#if formattedDueDate}}
        <table style="margin-left: auto; font-size: 12px;">
          <tr><td style="padding: 3px 10px 3px 0; color: #94a3b8;">Due Date:</td><td style="font-weight: 600;">{{formattedDueDate}}</td></tr>
        </table>
        {{/if}}
      </td>
    </tr>
  </table>

  <!-- Items -->
  <table style="width: 100%; margin-bottom: 24px; font-size: 12px;">
    <thead>
      <tr style="background: {{brand.primaryColor}}; color: #fff;">
        <th style="padding: 10px 14px; text-align: left; font-weight: 600; width: 36px;">#</th>
        <th style="padding: 10px 14px; text-align: left; font-weight: 600;">Description</th>
        <th style="padding: 10px 14px; text-align: center; font-weight: 600; width: 60px;">Qty</th>
        <th style="padding: 10px 14px; text-align: right; font-weight: 600; width: 110px;">Unit Price</th>
        <th style="padding: 10px 14px; text-align: right; font-weight: 600; width: 120px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0;">{{index}}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">{{description}}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: center;">{{quantity}}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: right;">{{rate}} {{currency}}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700;">{{lineTotal}} {{currency}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <!-- Totals -->
  <table style="width: 280px; margin-left: auto; font-size: 13px; margin-bottom: 28px;">
    <tr><td style="padding: 6px 0; color: #64748b;">Subtotal</td><td style="text-align: right; font-weight: 600;">{{subtotal}} {{currency}}</td></tr>
    {{#if hasDiscount}}<tr><td style="padding: 6px 0; color: #64748b;">Discount</td><td style="text-align: right; color: #ef4444;">-{{discountAmount}} {{currency}}</td></tr>{{/if}}
    {{#if hasTax}}<tr><td style="padding: 6px 0; color: #64748b;">VAT</td><td style="text-align: right;">{{taxAmount}} {{currency}}</td></tr>{{/if}}
    <tr style="border-top: 2px solid {{brand.primaryColor}};"><td style="padding: 10px 0; font-weight: 800; font-size: 16px; color: {{brand.primaryColor}};">Estimated Total</td><td style="padding: 10px 0; text-align: right; font-weight: 800; font-size: 16px; color: {{brand.primaryColor}};">{{total}} {{currency}}</td></tr>
  </table>

  {{#if hasBank}}
  <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 14px; margin-bottom: 20px;">
    <div style="font-size: 10px; font-weight: 700; color: #0284c7; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Bank Details</div>
    <div style="font-size: 12px; color: #0c4a6e;">Bank: {{bankName}} | Account: {{bankAccountName}}</div>
    <div style="font-size: 12px; color: #0c4a6e;">IBAN: {{bankIban}} {{#if bankSwift}}| SWIFT: {{bankSwift}}{{/if}}</div>
  </div>
  {{/if}}

  {{#if hasPaymentTerms}}
  <div style="margin-bottom: 14px;">
    <div style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 4px;">Payment Terms</div>
    <div style="font-size: 11px; color: #64748b;">{{paymentTerms}}</div>
  </div>
  {{/if}}

  {{#if hasTerms}}
  <div style="margin-bottom: 14px;">
    <div style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 4px;">Terms &amp; Conditions</div>
    <div style="font-size: 11px; color: #64748b;">{{termsAndConditions}}</div>
  </div>
  {{/if}}

  {{#if hasNotes}}<div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 4px; padding: 10px; margin-bottom: 14px; font-size: 11px; color: #78350f;">{{notes}}</div>{{/if}}

  <div style="margin-top: 36px; text-align: center; font-size: 10px; color: #94a3b8;">{{brand.footerText}}</div>
</body></html>`;

/* ════════════════════════════════════════════════════════════════════════════
 * TEMPLATE ARRAY
 * ════════════════════════════════════════════════════════════════════════════ */

const SEED_TEMPLATES: SeedTemplate[] = [
  {
    name: 'Invoice Classic',
    type: DocumentTemplateType.INVOICE,
    isDefault: true,
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      elements: [],
      variables: COMMON_VARS,
      templateHtml: invoiceClassicHtml
    },
    headerConfig: { showLogo: true, showCompanyInfo: true, style: 'classic' },
    footerConfig: { showPageNumbers: true, showFooterText: true },
    tableConfig: { showIndex: true, showUnit: false, alternateRows: true }
  },
  {
    name: 'Invoice Modern',
    type: DocumentTemplateType.INVOICE,
    isDefault: false,
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      elements: [],
      variables: COMMON_VARS,
      templateHtml: invoiceModernHtml
    },
    headerConfig: { showLogo: true, showCompanyInfo: true, style: 'modern' },
    footerConfig: { showPageNumbers: true, showFooterText: true },
    tableConfig: { showIndex: false, showUnit: false, alternateRows: false }
  },
  {
    name: 'Invoice Minimal',
    type: DocumentTemplateType.INVOICE,
    isDefault: false,
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      elements: [],
      variables: COMMON_VARS,
      templateHtml: invoiceMinimalHtml
    },
    headerConfig: { showLogo: false, showCompanyInfo: true, style: 'minimal' },
    footerConfig: { showPageNumbers: false, showFooterText: true },
    tableConfig: { showIndex: false, showUnit: false, alternateRows: false }
  },
  {
    name: 'Quote Professional',
    type: DocumentTemplateType.QUOTE,
    isDefault: true,
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      elements: [],
      variables: [...COMMON_VARS, 'formattedValidUntil'],
      templateHtml: quoteProfessionalHtml
    },
    headerConfig: { showLogo: true, showCompanyInfo: true, style: 'professional', fullWidthHeader: true },
    footerConfig: { showPageNumbers: true, showFooterText: true, showSignatures: true },
    tableConfig: { showIndex: true, showUnit: false, showCurrency: true }
  },
  {
    name: 'Quote Simple',
    type: DocumentTemplateType.QUOTE,
    isDefault: false,
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      elements: [],
      variables: [...COMMON_VARS, 'formattedValidUntil'],
      templateHtml: quoteSimpleHtml
    },
    headerConfig: { showLogo: false, showCompanyInfo: true, style: 'simple' },
    footerConfig: { showPageNumbers: false, showFooterText: true },
    tableConfig: { showIndex: false, showUnit: false }
  },
  {
    name: 'Contract Legal',
    type: DocumentTemplateType.CONTRACT,
    isDefault: true,
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      elements: [],
      variables: COMMON_VARS,
      templateHtml: contractLegalHtml
    },
    headerConfig: { showLogo: false, showCompanyInfo: true, style: 'legal', centeredHeader: true },
    footerConfig: { showPageNumbers: true, showFooterText: true, showSignatures: true },
    tableConfig: { showIndex: true, bordered: true }
  },
  {
    name: 'Contract Compact',
    type: DocumentTemplateType.CONTRACT,
    isDefault: false,
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      elements: [],
      variables: COMMON_VARS,
      templateHtml: contractCompactHtml
    },
    headerConfig: { showLogo: true, showCompanyInfo: true, style: 'compact' },
    footerConfig: { showPageNumbers: true, showFooterText: true, showSignatures: true },
    tableConfig: { showIndex: false }
  },
  {
    name: 'Purchase Order',
    type: DocumentTemplateType.PURCHASE_ORDER,
    isDefault: true,
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      elements: [],
      variables: COMMON_VARS,
      templateHtml: purchaseOrderHtml
    },
    headerConfig: { showLogo: true, showCompanyInfo: true, style: 'standard' },
    footerConfig: { showPageNumbers: true, showFooterText: true, showSignatures: true },
    tableConfig: { showIndex: true, showUnit: false }
  },
  {
    name: 'Sales Order',
    type: DocumentTemplateType.SALES_ORDER,
    isDefault: true,
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      elements: [],
      variables: COMMON_VARS,
      templateHtml: salesOrderHtml
    },
    headerConfig: { showLogo: true, showCompanyInfo: true, style: 'standard' },
    footerConfig: { showPageNumbers: true, showFooterText: true },
    tableConfig: { showIndex: true }
  },
  {
    name: 'Delivery Note',
    type: DocumentTemplateType.DELIVERY_NOTE,
    isDefault: true,
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      elements: [],
      variables: COMMON_VARS,
      templateHtml: deliveryNoteHtml
    },
    headerConfig: { showLogo: true, showCompanyInfo: true, style: 'standard' },
    footerConfig: { showPageNumbers: true, showFooterText: true, showAcknowledgment: true },
    tableConfig: { showIndex: true, showReceived: true, hideRateAndTotal: true }
  },
  {
    name: 'Credit Note',
    type: DocumentTemplateType.CREDIT_NOTE,
    isDefault: true,
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      elements: [],
      variables: COMMON_VARS,
      templateHtml: creditNoteHtml
    },
    headerConfig: { showLogo: true, showCompanyInfo: true, style: 'standard', accentColor: '#dc2626' },
    footerConfig: { showPageNumbers: true, showFooterText: true },
    tableConfig: { showIndex: true }
  },
  {
    name: 'Proforma Invoice',
    type: DocumentTemplateType.PROFORMA_INVOICE,
    isDefault: true,
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      elements: [],
      variables: [...COMMON_VARS, 'formattedValidUntil'],
      templateHtml: proformaInvoiceHtml
    },
    headerConfig: { showLogo: true, showCompanyInfo: true, style: 'standard', showDisclaimer: true },
    footerConfig: { showPageNumbers: true, showFooterText: true },
    tableConfig: { showIndex: true, showCurrency: true }
  }
];

/* ════════════════════════════════════════════════════════════════════════════
 * SEED FUNCTION
 * ════════════════════════════════════════════════════════════════════════════ */

/**
 * Seeds the document_templates table with system-level pre-built templates.
 * Uses `findOrCreate` to avoid duplicates on re-runs. Matches on name + type.
 */
export async function seedTemplates(): Promise<void> {
  // Starting template seed

  let created = 0;
  let skipped = 0;

  for (const tpl of SEED_TEMPLATES) {
    const [, wasCreated] = await DocumentTemplate.findOrCreate({
      where: { name: tpl.name, type: tpl.type },
      defaults: {
        layout: tpl.layout as unknown,
        headerConfig: tpl.headerConfig,
        footerConfig: tpl.footerConfig,
        tableConfig: tpl.tableConfig,
        isDefault: tpl.isDefault,
        userId: null as unknown,
        category: 'system'
      }
    });

    if (wasCreated) {
      created++;
      // Template created
    } else {
      skipped++;
      // Template already exists
    }
  }

  // Seed templates complete
}

export default seedTemplates;

/* ─── Standalone execution ────────────────────────────────────────────────── */
if (require.main === module) {
  sequelize
    .authenticate()
    .then(() => {
      // Database connected
      return seedTemplates();
    })
    .then(() => {
      // Seed complete
      process.exit(0);
    })
    .catch((err: Error) => {
      console.error('[seedTemplates] Fatal error:', err);
      process.exit(1);
    });
}
