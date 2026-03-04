/* eslint-disable require-await */
export interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'table' | 'line' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  props: Record<string, any>;
}

export interface TemplateLayout {
  pageSize: string;
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  elements: TemplateElement[];
  variables: string[];
  proContent?: any;
}

export type DocumentTemplateType =
  | 'INVOICE'
  | 'PURCHASE_ORDER'
  | 'QUOTE'
  | 'CONTRACT'
  | 'SALES_ORDER'
  | 'DELIVERY_NOTE'
  | 'CREDIT_NOTE'
  | 'PROFORMA_INVOICE'
  | 'RFQ'
  | 'SLA'
  | 'PROPOSAL'
  | 'GENERIC';

export interface DocumentTemplate {
  id: string;
  name: string;
  type: DocumentTemplateType;
  layout: TemplateLayout;
  headerConfig?: Record<string, any>;
  footerConfig?: Record<string, any>;
  tableConfig?: Record<string, any>;
  isDefault: boolean;
  category?: 'system' | 'custom';
  userId?: string;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function fetchDocumentTemplates(query?: Record<string, any>): Promise<{ docs: DocumentTemplate[]; pagination: any }> {
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  const { body, success } = await useApiFetch(`document-templates${qs}`);
  if (success && body) return body;
  return { docs: [], pagination: { totalItems: 0, page: 1, limit: 10 } };
}

export async function fetchDocumentTemplate(id: string): Promise<DocumentTemplate | null> {
  const { body, success } = await useApiFetch(`document-templates/${id}`);
  if (success && body) return body;
  return null;
}

export async function createDocumentTemplate(data: Partial<DocumentTemplate>) {
  return useApiFetch('document-templates', 'POST', data as any);
}

export async function updateDocumentTemplate(id: string, data: Partial<DocumentTemplate>) {
  return useApiFetch(`document-templates/${id}`, 'PUT', data as any);
}

export async function deleteDocumentTemplate(id: string) {
  return useApiFetch(`document-templates/${id}`, 'DELETE');
}

export async function cloneDocumentTemplate(id: string) {
  return useApiFetch(`document-templates/${id}/clone`, 'POST');
}

export async function seedDefaultTemplates() {
  return useApiFetch('document-templates/seed-defaults', 'POST');
}

export async function fetchDefaultConfigs(): Promise<DocumentTemplate[]> {
  const { body, success } = await useApiFetch('document-templates/default-configs');
  if (success && Array.isArray(body)) return body;
  return [];
}

// ---------------------------------------------------------------------------
// Built-in template definitions (fallback when API is unavailable)
// ---------------------------------------------------------------------------
function _el(id: string, type: TemplateElement['type'], x: number, y: number, w: number, h: number, props: Record<string, any>): TemplateElement {
  return { id, type, x, y, width: w, height: h, props };
}

const _baseLayout = (elements: TemplateElement[], variables: string[]): TemplateLayout => ({
  pageSize: 'A4',
  orientation: 'portrait' as const,
  margins: { top: 20, right: 15, bottom: 20, left: 15 },
  elements,
  variables
});

const INV_VARS = [
  'companyName',
  'companyAddress',
  'companyPhone',
  'companyEmail',
  'companyLogo',
  'invoiceNumber',
  'date',
  'dueDate',
  'clientName',
  'clientAddress',
  'clientPhone',
  'clientEmail',
  'items',
  'subtotal',
  'tax',
  'total',
  'notes'
];

const PO_VARS = [
  'companyName',
  'companyAddress',
  'companyPhone',
  'companyEmail',
  'companyLogo',
  'poNumber',
  'date',
  'deliveryDate',
  'vendorName',
  'vendorAddress',
  'vendorPhone',
  'vendorEmail',
  'projectName',
  'items',
  'subtotal',
  'tax',
  'total',
  'notes'
];

export const BUILTIN_TEMPLATES: DocumentTemplate[] = [
  // ── Invoice: Classic ─────────────────────────────────────────────────
  {
    id: 'builtin-inv-classic',
    name: 'Classic Invoice',
    type: 'INVOICE',
    isDefault: true,
    layout: _baseLayout(
      [
        _el('ci1', 'shape', 0, 0, 210, 45, { shape: 'rectangle', fill: '#1a365d' }),
        _el('ci2', 'image', 15, 8, 35, 28, { content: '{{companyLogo}}', objectFit: 'contain' }),
        _el('ci3', 'text', 60, 10, 90, 10, { content: '{{companyName}}', fontSize: 18, fontWeight: 'bold', color: '#ffffff', align: 'left' }),
        _el('ci4', 'text', 60, 22, 90, 8, { content: '{{companyAddress}}', fontSize: 9, color: '#cbd5e0', align: 'left' }),
        _el('ci5', 'text', 155, 10, 40, 10, { content: 'INVOICE', fontSize: 20, fontWeight: 'bold', color: '#ffffff', align: 'right' }),
        _el('ci6', 'text', 155, 24, 40, 6, { content: '#{{invoiceNumber}}', fontSize: 10, color: '#cbd5e0', align: 'right' }),
        _el('ci7', 'text', 15, 55, 80, 8, { content: 'Bill To:', fontSize: 10, fontWeight: 'bold', color: '#1a365d' }),
        _el('ci8', 'text', 15, 64, 80, 6, { content: '{{clientName}}', fontSize: 10, color: '#333333' }),
        _el('ci9', 'text', 15, 71, 80, 6, { content: '{{clientAddress}}', fontSize: 9, color: '#666666' }),
        _el('ci10', 'text', 130, 55, 65, 6, { content: 'Date: {{date}}', fontSize: 9, color: '#333333', align: 'right' }),
        _el('ci11', 'text', 130, 63, 65, 6, { content: 'Due: {{dueDate}}', fontSize: 9, color: '#333333', align: 'right' }),
        _el('ci12', 'line', 15, 85, 180, 1, { color: '#e2e8f0', thickness: 1 }),
        _el('ci13', 'table', 15, 90, 180, 80, {
          columns: ['Item', 'Qty', 'Price', 'Total'],
          columnWidths: [80, 30, 35, 35],
          headerBg: '#1a365d',
          headerColor: '#ffffff',
          borderColor: '#e2e8f0',
          fontSize: 9
        }),
        _el('ci14', 'line', 15, 178, 180, 1, { color: '#e2e8f0', thickness: 1 }),
        _el('ci15', 'text', 130, 182, 65, 6, { content: 'Subtotal: {{subtotal}}', fontSize: 10, color: '#333333', align: 'right' }),
        _el('ci16', 'text', 130, 190, 65, 6, { content: 'Tax: {{tax}}', fontSize: 10, color: '#333333', align: 'right' }),
        _el('ci17', 'shape', 125, 198, 70, 12, { shape: 'rectangle', fill: '#1a365d', borderRadius: 4 }),
        _el('ci18', 'text', 130, 200, 65, 8, { content: 'Total: {{total}}', fontSize: 12, fontWeight: 'bold', color: '#ffffff', align: 'right' }),
        _el('ci19', 'text', 15, 220, 100, 6, { content: '{{notes}}', fontSize: 8, color: '#888888' })
      ],
      INV_VARS
    )
  },

  // ── Invoice: Modern ──────────────────────────────────────────────────
  {
    id: 'builtin-inv-modern',
    name: 'Modern Invoice',
    type: 'INVOICE',
    isDefault: true,
    layout: _baseLayout(
      [
        _el('mi1', 'shape', 0, 0, 70, 297, { shape: 'rectangle', fill: '#6c63ff' }),
        _el('mi2', 'text', 10, 20, 50, 12, { content: 'INVOICE', fontSize: 16, fontWeight: 'bold', color: '#ffffff', align: 'center' }),
        _el('mi3', 'text', 10, 36, 50, 6, { content: '#{{invoiceNumber}}', fontSize: 9, color: '#d4d0ff', align: 'center' }),
        _el('mi4', 'image', 10, 55, 50, 35, { content: '{{companyLogo}}', objectFit: 'contain' }),
        _el('mi5', 'text', 10, 100, 50, 6, { content: '{{date}}', fontSize: 8, color: '#d4d0ff', align: 'center' }),
        _el('mi6', 'text', 10, 108, 50, 6, { content: 'Due: {{dueDate}}', fontSize: 8, color: '#d4d0ff', align: 'center' }),
        _el('mi7', 'text', 80, 20, 115, 10, { content: '{{companyName}}', fontSize: 16, fontWeight: 'bold', color: '#333333' }),
        _el('mi8', 'text', 80, 32, 115, 6, { content: '{{companyAddress}} | {{companyPhone}}', fontSize: 8, color: '#888888' }),
        _el('mi9', 'line', 80, 45, 115, 1, { color: '#e0e0e0', thickness: 1 }),
        _el('mi10', 'text', 80, 50, 60, 6, { content: 'Bill To:', fontSize: 9, fontWeight: 'bold', color: '#6c63ff' }),
        _el('mi11', 'text', 80, 58, 115, 6, { content: '{{clientName}}', fontSize: 10, color: '#333333' }),
        _el('mi12', 'text', 80, 66, 115, 6, { content: '{{clientAddress}}', fontSize: 8, color: '#666666' }),
        _el('mi13', 'table', 80, 82, 115, 80, {
          columns: ['Item', 'Qty', 'Price', 'Total'],
          columnWidths: [50, 20, 22, 23],
          headerBg: '#6c63ff',
          headerColor: '#ffffff',
          borderColor: '#e8e6ff',
          fontSize: 8
        }),
        _el('mi14', 'line', 80, 170, 115, 1, { color: '#e0e0e0', thickness: 1 }),
        _el('mi15', 'text', 140, 175, 55, 6, { content: 'Subtotal: {{subtotal}}', fontSize: 9, color: '#333333', align: 'right' }),
        _el('mi16', 'text', 140, 183, 55, 6, { content: 'Tax: {{tax}}', fontSize: 9, color: '#333333', align: 'right' }),
        _el('mi17', 'shape', 135, 192, 60, 12, { shape: 'rectangle', fill: '#6c63ff', borderRadius: 6 }),
        _el('mi18', 'text', 140, 194, 55, 8, { content: 'Total: {{total}}', fontSize: 11, fontWeight: 'bold', color: '#ffffff', align: 'right' }),
        _el('mi19', 'text', 80, 215, 115, 6, { content: '{{notes}}', fontSize: 8, color: '#999999' })
      ],
      INV_VARS
    )
  },

  // ── Invoice: Minimal ─────────────────────────────────────────────────
  {
    id: 'builtin-inv-minimal',
    name: 'Minimal Invoice',
    type: 'INVOICE',
    isDefault: true,
    layout: _baseLayout(
      [
        _el('ni1', 'text', 15, 15, 80, 14, { content: '{{companyName}}', fontSize: 22, fontWeight: 'bold', color: '#111111' }),
        _el('ni2', 'text', 15, 30, 80, 6, { content: '{{companyAddress}}', fontSize: 8, color: '#999999' }),
        _el('ni3', 'text', 140, 15, 55, 10, { content: 'INVOICE', fontSize: 14, fontWeight: 'bold', color: '#111111', align: 'right' }),
        _el('ni4', 'text', 140, 27, 55, 6, { content: '#{{invoiceNumber}}', fontSize: 9, color: '#999999', align: 'right' }),
        _el('ni5', 'line', 15, 42, 180, 1, { color: '#111111', thickness: 2 }),
        _el('ni6', 'text', 15, 50, 80, 6, { content: '{{clientName}}', fontSize: 10, fontWeight: 'bold', color: '#333333' }),
        _el('ni7', 'text', 15, 58, 80, 6, { content: '{{clientAddress}}', fontSize: 8, color: '#666666' }),
        _el('ni8', 'text', 140, 50, 55, 6, { content: 'Date: {{date}}', fontSize: 8, color: '#666666', align: 'right' }),
        _el('ni9', 'text', 140, 58, 55, 6, { content: 'Due: {{dueDate}}', fontSize: 8, color: '#666666', align: 'right' }),
        _el('ni10', 'table', 15, 74, 180, 80, {
          columns: ['Description', 'Qty', 'Rate', 'Amount'],
          columnWidths: [80, 30, 35, 35],
          headerBg: '#f5f5f5',
          headerColor: '#333333',
          borderColor: '#e0e0e0',
          fontSize: 9
        }),
        _el('ni11', 'line', 15, 162, 180, 1, { color: '#e0e0e0', thickness: 1 }),
        _el('ni12', 'text', 140, 168, 55, 6, { content: 'Subtotal: {{subtotal}}', fontSize: 9, color: '#333333', align: 'right' }),
        _el('ni13', 'text', 140, 176, 55, 6, { content: 'Tax: {{tax}}', fontSize: 9, color: '#333333', align: 'right' }),
        _el('ni14', 'line', 140, 184, 55, 1, { color: '#111111', thickness: 1 }),
        _el('ni15', 'text', 140, 188, 55, 8, { content: 'Total: {{total}}', fontSize: 12, fontWeight: 'bold', color: '#111111', align: 'right' }),
        _el('ni16', 'text', 15, 210, 120, 6, { content: '{{notes}}', fontSize: 8, color: '#999999' })
      ],
      INV_VARS
    )
  },

  // ── Purchase Order: Classic ──────────────────────────────────────────
  {
    id: 'builtin-po-classic',
    name: 'Classic Purchase Order',
    type: 'PURCHASE_ORDER',
    isDefault: true,
    layout: _baseLayout(
      [
        _el('pc1', 'shape', 0, 0, 210, 45, { shape: 'rectangle', fill: '#065f46' }),
        _el('pc2', 'image', 15, 8, 35, 28, { content: '{{companyLogo}}', objectFit: 'contain' }),
        _el('pc3', 'text', 60, 10, 90, 10, { content: '{{companyName}}', fontSize: 18, fontWeight: 'bold', color: '#ffffff' }),
        _el('pc4', 'text', 60, 22, 90, 8, { content: '{{companyAddress}}', fontSize: 9, color: '#a7f3d0' }),
        _el('pc5', 'text', 150, 10, 45, 10, { content: 'PURCHASE ORDER', fontSize: 13, fontWeight: 'bold', color: '#ffffff', align: 'right' }),
        _el('pc6', 'text', 155, 24, 40, 6, { content: '#{{poNumber}}', fontSize: 10, color: '#a7f3d0', align: 'right' }),
        _el('pc7', 'text', 15, 55, 80, 8, { content: 'Vendor:', fontSize: 10, fontWeight: 'bold', color: '#065f46' }),
        _el('pc8', 'text', 15, 64, 80, 6, { content: '{{vendorName}}', fontSize: 10, color: '#333333' }),
        _el('pc9', 'text', 15, 71, 80, 6, { content: '{{vendorAddress}}', fontSize: 9, color: '#666666' }),
        _el('pc10', 'text', 130, 55, 65, 6, { content: 'Date: {{date}}', fontSize: 9, color: '#333333', align: 'right' }),
        _el('pc11', 'text', 130, 63, 65, 6, { content: 'Delivery: {{deliveryDate}}', fontSize: 9, color: '#333333', align: 'right' }),
        _el('pc12', 'text', 130, 71, 65, 6, { content: 'Project: {{projectName}}', fontSize: 9, color: '#333333', align: 'right' }),
        _el('pc13', 'line', 15, 85, 180, 1, { color: '#d1fae5', thickness: 1 }),
        _el('pc14', 'table', 15, 90, 180, 80, {
          columns: ['Item', 'Qty', 'Price', 'Total'],
          columnWidths: [80, 30, 35, 35],
          headerBg: '#065f46',
          headerColor: '#ffffff',
          borderColor: '#d1fae5',
          fontSize: 9
        }),
        _el('pc15', 'line', 15, 178, 180, 1, { color: '#d1fae5', thickness: 1 }),
        _el('pc16', 'text', 130, 182, 65, 6, { content: 'Subtotal: {{subtotal}}', fontSize: 10, color: '#333333', align: 'right' }),
        _el('pc17', 'text', 130, 190, 65, 6, { content: 'Tax: {{tax}}', fontSize: 10, color: '#333333', align: 'right' }),
        _el('pc18', 'shape', 125, 198, 70, 12, { shape: 'rectangle', fill: '#065f46', borderRadius: 4 }),
        _el('pc19', 'text', 130, 200, 65, 8, { content: 'Total: {{total}}', fontSize: 12, fontWeight: 'bold', color: '#ffffff', align: 'right' }),
        _el('pc20', 'text', 15, 220, 100, 6, { content: '{{notes}}', fontSize: 8, color: '#888888' })
      ],
      PO_VARS
    )
  },

  // ── Purchase Order: Modern ───────────────────────────────────────────
  {
    id: 'builtin-po-modern',
    name: 'Modern Purchase Order',
    type: 'PURCHASE_ORDER',
    isDefault: true,
    layout: _baseLayout(
      [
        _el('pm1', 'shape', 0, 0, 210, 8, { shape: 'rectangle', fill: '#e67e22' }),
        _el('pm2', 'image', 15, 18, 35, 28, { content: '{{companyLogo}}', objectFit: 'contain' }),
        _el('pm3', 'text', 60, 18, 80, 10, { content: '{{companyName}}', fontSize: 16, fontWeight: 'bold', color: '#333333' }),
        _el('pm4', 'text', 60, 30, 80, 6, { content: '{{companyAddress}}', fontSize: 8, color: '#888888' }),
        _el('pm5', 'shape', 140, 15, 55, 28, { shape: 'rectangle', fill: '#fef3e2', borderRadius: 6 }),
        _el('pm6', 'text', 142, 18, 51, 8, { content: 'PURCHASE ORDER', fontSize: 10, fontWeight: 'bold', color: '#e67e22', align: 'center' }),
        _el('pm7', 'text', 142, 28, 51, 6, { content: '#{{poNumber}}', fontSize: 9, color: '#b45309', align: 'center' }),
        _el('pm8', 'line', 15, 52, 180, 1, { color: '#f0f0f0', thickness: 1 }),
        _el('pm9', 'text', 15, 58, 80, 6, { content: 'Vendor', fontSize: 9, fontWeight: 'bold', color: '#e67e22' }),
        _el('pm10', 'text', 15, 66, 80, 6, { content: '{{vendorName}}', fontSize: 10, color: '#333333' }),
        _el('pm11', 'text', 15, 73, 80, 6, { content: '{{vendorAddress}}', fontSize: 8, color: '#666666' }),
        _el('pm12', 'text', 130, 58, 65, 6, { content: 'Date: {{date}}', fontSize: 8, color: '#666666', align: 'right' }),
        _el('pm13', 'text', 130, 66, 65, 6, { content: 'Delivery: {{deliveryDate}}', fontSize: 8, color: '#666666', align: 'right' }),
        _el('pm14', 'text', 130, 74, 65, 6, { content: 'Project: {{projectName}}', fontSize: 8, color: '#666666', align: 'right' }),
        _el('pm15', 'table', 15, 88, 180, 80, {
          columns: ['Item', 'Qty', 'Unit Price', 'Total'],
          columnWidths: [80, 30, 35, 35],
          headerBg: '#e67e22',
          headerColor: '#ffffff',
          borderColor: '#fde8cd',
          fontSize: 9
        }),
        _el('pm16', 'line', 15, 176, 180, 1, { color: '#f0f0f0', thickness: 1 }),
        _el('pm17', 'text', 130, 180, 65, 6, { content: 'Subtotal: {{subtotal}}', fontSize: 9, color: '#333333', align: 'right' }),
        _el('pm18', 'text', 130, 188, 65, 6, { content: 'Tax: {{tax}}', fontSize: 9, color: '#333333', align: 'right' }),
        _el('pm19', 'shape', 125, 196, 70, 12, { shape: 'rectangle', fill: '#e67e22', borderRadius: 4 }),
        _el('pm20', 'text', 130, 198, 65, 8, { content: 'Total: {{total}}', fontSize: 11, fontWeight: 'bold', color: '#ffffff', align: 'right' }),
        _el('pm21', 'text', 15, 218, 100, 6, { content: '{{notes}}', fontSize: 8, color: '#999999' })
      ],
      PO_VARS
    )
  },

  // ── Purchase Order: Minimal ──────────────────────────────────────────
  {
    id: 'builtin-po-minimal',
    name: 'Minimal Purchase Order',
    type: 'PURCHASE_ORDER',
    isDefault: true,
    layout: _baseLayout(
      [
        _el('pn1', 'text', 15, 15, 80, 14, { content: '{{companyName}}', fontSize: 22, fontWeight: 'bold', color: '#111111' }),
        _el('pn2', 'text', 15, 30, 80, 6, { content: '{{companyAddress}}', fontSize: 8, color: '#999999' }),
        _el('pn3', 'text', 120, 15, 75, 10, { content: 'PURCHASE ORDER', fontSize: 14, fontWeight: 'bold', color: '#111111', align: 'right' }),
        _el('pn4', 'text', 140, 27, 55, 6, { content: '#{{poNumber}}', fontSize: 9, color: '#999999', align: 'right' }),
        _el('pn5', 'line', 15, 42, 180, 1, { color: '#111111', thickness: 2 }),
        _el('pn6', 'text', 15, 50, 80, 6, { content: '{{vendorName}}', fontSize: 10, fontWeight: 'bold', color: '#333333' }),
        _el('pn7', 'text', 15, 58, 80, 6, { content: '{{vendorAddress}}', fontSize: 8, color: '#666666' }),
        _el('pn8', 'text', 140, 50, 55, 6, { content: 'Date: {{date}}', fontSize: 8, color: '#666666', align: 'right' }),
        _el('pn9', 'text', 140, 58, 55, 6, { content: 'Due: {{deliveryDate}}', fontSize: 8, color: '#666666', align: 'right' }),
        _el('pn10', 'text', 140, 66, 55, 6, { content: '{{projectName}}', fontSize: 8, color: '#666666', align: 'right' }),
        _el('pn11', 'table', 15, 80, 180, 80, {
          columns: ['Description', 'Qty', 'Rate', 'Amount'],
          columnWidths: [80, 30, 35, 35],
          headerBg: '#f5f5f5',
          headerColor: '#333333',
          borderColor: '#e0e0e0',
          fontSize: 9
        }),
        _el('pn12', 'line', 15, 168, 180, 1, { color: '#e0e0e0', thickness: 1 }),
        _el('pn13', 'text', 140, 174, 55, 6, { content: 'Subtotal: {{subtotal}}', fontSize: 9, color: '#333333', align: 'right' }),
        _el('pn14', 'text', 140, 182, 55, 6, { content: 'Tax: {{tax}}', fontSize: 9, color: '#333333', align: 'right' }),
        _el('pn15', 'line', 140, 190, 55, 1, { color: '#111111', thickness: 1 }),
        _el('pn16', 'text', 140, 194, 55, 8, { content: 'Total: {{total}}', fontSize: 12, fontWeight: 'bold', color: '#111111', align: 'right' }),
        _el('pn17', 'text', 15, 215, 120, 6, { content: '{{notes}}', fontSize: 8, color: '#999999' })
      ],
      PO_VARS
    )
  }
];
