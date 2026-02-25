/**
 * Document Conversion Utility
 * Convert documents between types while preserving data.
 * Supports defined conversion paths with smart field mapping.
 */

import type { ProposalData } from '~/components/DocumentBuilder/types';

// ── Allowed Conversion Paths ───────────────────────────
export const conversionPaths: Record<string, string[]> = {
  quote: ['invoice', 'proforma_invoice', 'sales_order'],
  proforma_invoice: ['invoice'],
  sales_order: ['invoice', 'delivery_note'],
  purchase_order: ['delivery_note', 'invoice'],
  invoice: ['credit_note'],
  rfq: ['purchase_order', 'quote'],
  proposal: ['contract', 'quote'],
  contract: ['invoice', 'sla'],
  delivery_note: [],
  credit_note: [],
  sla: []
};

// ── Ref Prefixes ───────────────────────────────────────
const refPrefixes: Record<string, string> = {
  proposal: 'PRP',
  contract: 'CTR',
  invoice: 'INV',
  proforma_invoice: 'PI',
  purchase_order: 'PO',
  credit_note: 'CN',
  quote: 'QT',
  rfq: 'RFQ',
  sales_order: 'SO',
  delivery_note: 'DN',
  sla: 'SLA'
};

// ── Default Titles ─────────────────────────────────────
const defaultTitles: Record<string, string> = {
  proposal: 'Project Proposal',
  contract: 'Service Agreement',
  invoice: 'Invoice',
  proforma_invoice: 'Proforma Invoice',
  purchase_order: 'Purchase Order',
  credit_note: 'Credit Note',
  quote: 'Quotation',
  rfq: 'Request for Quotation',
  sales_order: 'Sales Order',
  delivery_note: 'Delivery Note',
  sla: 'Service Level Agreement'
};

// ── Type Labels (for UI) ───────────────────────────────
export const conversionLabels: Record<string, string> = {
  invoice: '🧾 Invoice',
  proforma_invoice: '📋 Proforma Invoice',
  purchase_order: '🛒 Purchase Order',
  credit_note: '↩️ Credit Note',
  quote: '💬 Quotation',
  rfq: '❓ RFQ',
  sales_order: '📦 Sales Order',
  delivery_note: '🚚 Delivery Note',
  contract: '📝 Contract',
  proposal: '📊 Proposal',
  sla: '🛡️ SLA'
};

// ── Convert Function ───────────────────────────────────
export function convertDocument(source: ProposalData, targetType: string): ProposalData {
  const allowed = conversionPaths[source.documentType] || [];
  if (!allowed.includes(targetType)) {
    throw new Error(`Cannot convert ${source.documentType} to ${targetType}`);
  }

  const prefix = refPrefixes[targetType] || 'DOC';
  const newRef = `${prefix}-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;

  // Clone and remap
  const converted: ProposalData = {
    ...JSON.parse(JSON.stringify(source)),
    id: Date.now(),
    documentType: targetType as ProposalData['documentType'],
    refNumber: newRef,
    title: defaultTitles[targetType] || 'Document',
    status: 'Draft' as const,
    date: new Date().toISOString().slice(0, 10)
  };

  return converted;
}

// ── Get Available Conversions ──────────────────────────
export function getAvailableConversions(documentType: string): Array<{ type: string; label: string }> {
  const targets = conversionPaths[documentType] || [];
  return targets.map(type => ({
    type,
    label: conversionLabels[type] || type
  }));
}
