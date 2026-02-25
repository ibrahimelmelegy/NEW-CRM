import { Op } from 'sequelize';
import DocumentTemplate, { DocumentTemplateType, TemplateLayout } from './documentTemplateModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import { clampPagination } from '../utils/pagination';

const INVOICE_VARIABLES = [
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

const PO_VARIABLES = [
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

function makeInvoiceLayout(overrides: Partial<TemplateLayout> & { elements: TemplateLayout['elements'] }): TemplateLayout {
  return {
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: 20, right: 15, bottom: 20, left: 15 },
    variables: INVOICE_VARIABLES,
    ...overrides
  };
}

function makePOLayout(overrides: Partial<TemplateLayout> & { elements: TemplateLayout['elements'] }): TemplateLayout {
  return {
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: 20, right: 15, bottom: 20, left: 15 },
    variables: PO_VARIABLES,
    ...overrides
  };
}

// 6 Pre-built template configs
const DEFAULT_TEMPLATES = [
  // 1. Classic Invoice
  {
    name: 'Classic Invoice',
    type: DocumentTemplateType.INVOICE,
    isDefault: true,
    layout: makeInvoiceLayout({
      elements: [
        { id: 'logo', type: 'image' as const, x: 15, y: 15, width: 40, height: 40, props: { content: '{{companyLogo}}', objectFit: 'contain' } },
        {
          id: 'company',
          type: 'text' as const,
          x: 60,
          y: 15,
          width: 80,
          height: 20,
          props: { content: '{{companyName}}', fontSize: 20, fontWeight: 'bold', color: '#000000', fontFamily: 'Times-Roman', align: 'left' }
        },
        {
          id: 'companyAddr',
          type: 'text' as const,
          x: 60,
          y: 35,
          width: 80,
          height: 15,
          props: { content: '{{companyAddress}}', fontSize: 10, color: '#333333', fontFamily: 'Times-Roman', align: 'left' }
        },
        {
          id: 'title',
          type: 'text' as const,
          x: 140,
          y: 15,
          width: 55,
          height: 15,
          props: { content: 'INVOICE', fontSize: 24, fontWeight: 'bold', color: '#000000', fontFamily: 'Times-Roman', align: 'right' }
        },
        {
          id: 'invoiceNum',
          type: 'text' as const,
          x: 140,
          y: 35,
          width: 55,
          height: 10,
          props: { content: '#{{invoiceNumber}}', fontSize: 11, color: '#555555', fontFamily: 'Times-Roman', align: 'right' }
        },
        {
          id: 'dateLbl',
          type: 'text' as const,
          x: 140,
          y: 45,
          width: 55,
          height: 10,
          props: { content: 'Date: {{date}}', fontSize: 10, color: '#555555', fontFamily: 'Times-Roman', align: 'right' }
        },
        {
          id: 'dueLbl',
          type: 'text' as const,
          x: 140,
          y: 55,
          width: 55,
          height: 10,
          props: { content: 'Due: {{dueDate}}', fontSize: 10, color: '#555555', fontFamily: 'Times-Roman', align: 'right' }
        },
        { id: 'sep1', type: 'line' as const, x: 15, y: 68, width: 180, height: 1, props: { color: '#000000', thickness: 1 } },
        {
          id: 'billTo',
          type: 'text' as const,
          x: 15,
          y: 75,
          width: 50,
          height: 8,
          props: { content: 'Bill To:', fontSize: 11, fontWeight: 'bold', color: '#000000', fontFamily: 'Times-Roman', align: 'left' }
        },
        {
          id: 'clientName',
          type: 'text' as const,
          x: 15,
          y: 83,
          width: 80,
          height: 8,
          props: { content: '{{clientName}}', fontSize: 11, color: '#333333', fontFamily: 'Times-Roman', align: 'left' }
        },
        {
          id: 'clientAddr',
          type: 'text' as const,
          x: 15,
          y: 91,
          width: 80,
          height: 8,
          props: { content: '{{clientAddress}}', fontSize: 10, color: '#555555', fontFamily: 'Times-Roman', align: 'left' }
        },
        {
          id: 'itemsTable',
          type: 'table' as const,
          x: 15,
          y: 110,
          width: 180,
          height: 80,
          props: {
            columns: ['Description', 'Qty', 'Unit Price', 'Total'],
            columnWidths: [90, 25, 35, 30],
            headerBg: '#f0f0f0',
            headerColor: '#000000',
            borderColor: '#cccccc',
            fontSize: 10,
            fontFamily: 'Times-Roman'
          }
        },
        {
          id: 'subtotal',
          type: 'text' as const,
          x: 130,
          y: 195,
          width: 65,
          height: 8,
          props: { content: 'Subtotal: {{subtotal}}', fontSize: 10, color: '#333333', fontFamily: 'Times-Roman', align: 'right' }
        },
        {
          id: 'tax',
          type: 'text' as const,
          x: 130,
          y: 205,
          width: 65,
          height: 8,
          props: { content: 'Tax: {{tax}}', fontSize: 10, color: '#333333', fontFamily: 'Times-Roman', align: 'right' }
        },
        { id: 'sep2', type: 'line' as const, x: 130, y: 214, width: 65, height: 1, props: { color: '#000000', thickness: 1 } },
        {
          id: 'total',
          type: 'text' as const,
          x: 130,
          y: 218,
          width: 65,
          height: 10,
          props: { content: 'Total: {{total}}', fontSize: 14, fontWeight: 'bold', color: '#000000', fontFamily: 'Times-Roman', align: 'right' }
        },
        {
          id: 'notes',
          type: 'text' as const,
          x: 15,
          y: 240,
          width: 180,
          height: 20,
          props: { content: '{{notes}}', fontSize: 9, color: '#777777', fontFamily: 'Times-Roman', align: 'left' }
        }
      ]
    })
  },
  // 2. Modern Invoice
  {
    name: 'Modern Invoice',
    type: DocumentTemplateType.INVOICE,
    isDefault: true,
    layout: makeInvoiceLayout({
      elements: [
        {
          id: 'accentBar',
          type: 'shape' as const,
          x: 0,
          y: 0,
          width: 210,
          height: 8,
          props: { shape: 'rectangle', fill: '#2563eb', borderRadius: 0 }
        },
        {
          id: 'company',
          type: 'text' as const,
          x: 15,
          y: 18,
          width: 100,
          height: 16,
          props: { content: '{{companyName}}', fontSize: 22, fontWeight: 'bold', color: '#1e293b', fontFamily: 'Helvetica', align: 'left' }
        },
        {
          id: 'companyAddr',
          type: 'text' as const,
          x: 15,
          y: 34,
          width: 100,
          height: 12,
          props: { content: '{{companyAddress}} | {{companyPhone}}', fontSize: 9, color: '#64748b', fontFamily: 'Helvetica', align: 'left' }
        },
        {
          id: 'title',
          type: 'text' as const,
          x: 140,
          y: 18,
          width: 55,
          height: 14,
          props: { content: 'INVOICE', fontSize: 18, fontWeight: 'bold', color: '#2563eb', fontFamily: 'Helvetica', align: 'right' }
        },
        {
          id: 'invoiceNum',
          type: 'text' as const,
          x: 140,
          y: 34,
          width: 55,
          height: 8,
          props: { content: '#{{invoiceNumber}}', fontSize: 10, color: '#64748b', fontFamily: 'Helvetica', align: 'right' }
        },
        {
          id: 'dateLbl',
          type: 'text' as const,
          x: 140,
          y: 44,
          width: 55,
          height: 8,
          props: { content: 'Date: {{date}}', fontSize: 9, color: '#64748b', fontFamily: 'Helvetica', align: 'right' }
        },
        {
          id: 'dueLbl',
          type: 'text' as const,
          x: 140,
          y: 53,
          width: 55,
          height: 8,
          props: { content: 'Due: {{dueDate}}', fontSize: 9, color: '#64748b', fontFamily: 'Helvetica', align: 'right' }
        },
        {
          id: 'billTo',
          type: 'text' as const,
          x: 15,
          y: 70,
          width: 50,
          height: 8,
          props: { content: 'BILL TO', fontSize: 9, fontWeight: 'bold', color: '#2563eb', fontFamily: 'Helvetica', align: 'left', letterSpacing: 1 }
        },
        {
          id: 'clientName',
          type: 'text' as const,
          x: 15,
          y: 80,
          width: 80,
          height: 8,
          props: { content: '{{clientName}}', fontSize: 12, fontWeight: 'bold', color: '#1e293b', fontFamily: 'Helvetica', align: 'left' }
        },
        {
          id: 'clientAddr',
          type: 'text' as const,
          x: 15,
          y: 90,
          width: 80,
          height: 8,
          props: { content: '{{clientAddress}}', fontSize: 9, color: '#64748b', fontFamily: 'Helvetica', align: 'left' }
        },
        {
          id: 'itemsTable',
          type: 'table' as const,
          x: 15,
          y: 108,
          width: 180,
          height: 80,
          props: {
            columns: ['Description', 'Qty', 'Rate', 'Amount'],
            columnWidths: [90, 25, 35, 30],
            headerBg: '#2563eb',
            headerColor: '#ffffff',
            borderColor: '#e2e8f0',
            fontSize: 9,
            fontFamily: 'Helvetica',
            stripedBg: '#f8fafc'
          }
        },
        {
          id: 'subtotal',
          type: 'text' as const,
          x: 130,
          y: 195,
          width: 65,
          height: 8,
          props: { content: 'Subtotal: {{subtotal}}', fontSize: 10, color: '#475569', fontFamily: 'Helvetica', align: 'right' }
        },
        {
          id: 'tax',
          type: 'text' as const,
          x: 130,
          y: 205,
          width: 65,
          height: 8,
          props: { content: 'Tax: {{tax}}', fontSize: 10, color: '#475569', fontFamily: 'Helvetica', align: 'right' }
        },
        {
          id: 'totalBg',
          type: 'shape' as const,
          x: 130,
          y: 215,
          width: 65,
          height: 14,
          props: { shape: 'rectangle', fill: '#2563eb', borderRadius: 4 }
        },
        {
          id: 'total',
          type: 'text' as const,
          x: 130,
          y: 217,
          width: 65,
          height: 10,
          props: { content: 'Total: {{total}}', fontSize: 13, fontWeight: 'bold', color: '#ffffff', fontFamily: 'Helvetica', align: 'center' }
        },
        {
          id: 'notes',
          type: 'text' as const,
          x: 15,
          y: 245,
          width: 180,
          height: 15,
          props: { content: '{{notes}}', fontSize: 9, color: '#94a3b8', fontFamily: 'Helvetica', align: 'left' }
        }
      ]
    })
  },
  // 3. Corporate Invoice
  {
    name: 'Corporate Invoice',
    type: DocumentTemplateType.INVOICE,
    isDefault: true,
    layout: makeInvoiceLayout({
      elements: [
        { id: 'headerBand', type: 'shape' as const, x: 0, y: 0, width: 210, height: 50, props: { shape: 'rectangle', fill: '#1e3a5f' } },
        { id: 'logo', type: 'image' as const, x: 15, y: 8, width: 35, height: 35, props: { content: '{{companyLogo}}', objectFit: 'contain' } },
        {
          id: 'company',
          type: 'text' as const,
          x: 55,
          y: 12,
          width: 90,
          height: 14,
          props: { content: '{{companyName}}', fontSize: 18, fontWeight: 'bold', color: '#ffffff', fontFamily: 'Helvetica', align: 'left' }
        },
        {
          id: 'companyAddr',
          type: 'text' as const,
          x: 55,
          y: 28,
          width: 90,
          height: 10,
          props: { content: '{{companyAddress}}', fontSize: 9, color: '#b0c4de', fontFamily: 'Helvetica', align: 'left' }
        },
        {
          id: 'title',
          type: 'text' as const,
          x: 150,
          y: 15,
          width: 45,
          height: 12,
          props: { content: 'INVOICE', fontSize: 16, fontWeight: 'bold', color: '#ffffff', fontFamily: 'Helvetica', align: 'right' }
        },
        {
          id: 'invoiceNum',
          type: 'text' as const,
          x: 150,
          y: 30,
          width: 45,
          height: 8,
          props: { content: '#{{invoiceNumber}}', fontSize: 10, color: '#b0c4de', fontFamily: 'Helvetica', align: 'right' }
        },
        {
          id: 'infoGrid',
          type: 'shape' as const,
          x: 15,
          y: 58,
          width: 180,
          height: 35,
          props: { shape: 'rectangle', fill: '#f1f5f9', borderRadius: 4 }
        },
        {
          id: 'dateLbl',
          type: 'text' as const,
          x: 20,
          y: 62,
          width: 40,
          height: 8,
          props: { content: 'Date:', fontSize: 9, fontWeight: 'bold', color: '#475569', fontFamily: 'Helvetica', align: 'left' }
        },
        {
          id: 'dateVal',
          type: 'text' as const,
          x: 20,
          y: 71,
          width: 40,
          height: 8,
          props: { content: '{{date}}', fontSize: 10, color: '#1e293b', fontFamily: 'Helvetica', align: 'left' }
        },
        {
          id: 'dueDateLbl',
          type: 'text' as const,
          x: 70,
          y: 62,
          width: 40,
          height: 8,
          props: { content: 'Due Date:', fontSize: 9, fontWeight: 'bold', color: '#475569', fontFamily: 'Helvetica', align: 'left' }
        },
        {
          id: 'dueDateVal',
          type: 'text' as const,
          x: 70,
          y: 71,
          width: 40,
          height: 8,
          props: { content: '{{dueDate}}', fontSize: 10, color: '#1e293b', fontFamily: 'Helvetica', align: 'left' }
        },
        {
          id: 'billToLbl',
          type: 'text' as const,
          x: 120,
          y: 62,
          width: 70,
          height: 8,
          props: { content: 'Bill To:', fontSize: 9, fontWeight: 'bold', color: '#475569', fontFamily: 'Helvetica', align: 'left' }
        },
        {
          id: 'clientName',
          type: 'text' as const,
          x: 120,
          y: 71,
          width: 70,
          height: 8,
          props: { content: '{{clientName}}', fontSize: 10, fontWeight: 'bold', color: '#1e293b', fontFamily: 'Helvetica', align: 'left' }
        },
        {
          id: 'clientAddr',
          type: 'text' as const,
          x: 120,
          y: 80,
          width: 70,
          height: 8,
          props: { content: '{{clientAddress}}', fontSize: 9, color: '#64748b', fontFamily: 'Helvetica', align: 'left' }
        },
        {
          id: 'itemsTable',
          type: 'table' as const,
          x: 15,
          y: 100,
          width: 180,
          height: 80,
          props: {
            columns: ['Item', 'Qty', 'Price', 'Total'],
            columnWidths: [90, 25, 35, 30],
            headerBg: '#1e3a5f',
            headerColor: '#ffffff',
            borderColor: '#e2e8f0',
            fontSize: 9,
            fontFamily: 'Helvetica'
          }
        },
        {
          id: 'subtotal',
          type: 'text' as const,
          x: 130,
          y: 190,
          width: 65,
          height: 8,
          props: { content: 'Subtotal: {{subtotal}}', fontSize: 10, color: '#475569', fontFamily: 'Helvetica', align: 'right' }
        },
        {
          id: 'tax',
          type: 'text' as const,
          x: 130,
          y: 200,
          width: 65,
          height: 8,
          props: { content: 'Tax: {{tax}}', fontSize: 10, color: '#475569', fontFamily: 'Helvetica', align: 'right' }
        },
        { id: 'sep', type: 'line' as const, x: 130, y: 210, width: 65, height: 1, props: { color: '#1e3a5f', thickness: 2 } },
        {
          id: 'total',
          type: 'text' as const,
          x: 130,
          y: 214,
          width: 65,
          height: 10,
          props: { content: 'Total: {{total}}', fontSize: 14, fontWeight: 'bold', color: '#1e3a5f', fontFamily: 'Helvetica', align: 'right' }
        },
        {
          id: 'notes',
          type: 'text' as const,
          x: 15,
          y: 240,
          width: 180,
          height: 15,
          props: { content: '{{notes}}', fontSize: 9, color: '#94a3b8', fontFamily: 'Helvetica', align: 'left' }
        }
      ]
    })
  },
  // 4. Classic Purchase Order
  {
    name: 'Classic Purchase Order',
    type: DocumentTemplateType.PURCHASE_ORDER,
    isDefault: true,
    layout: makePOLayout({
      elements: [
        { id: 'logo', type: 'image' as const, x: 15, y: 15, width: 40, height: 40, props: { content: '{{companyLogo}}', objectFit: 'contain' } },
        {
          id: 'company',
          type: 'text' as const,
          x: 60,
          y: 15,
          width: 80,
          height: 20,
          props: { content: '{{companyName}}', fontSize: 20, fontWeight: 'bold', color: '#000000', fontFamily: 'Times-Roman', align: 'left' }
        },
        {
          id: 'companyAddr',
          type: 'text' as const,
          x: 60,
          y: 35,
          width: 80,
          height: 15,
          props: { content: '{{companyAddress}}', fontSize: 10, color: '#333333', fontFamily: 'Times-Roman', align: 'left' }
        },
        {
          id: 'title',
          type: 'text' as const,
          x: 130,
          y: 15,
          width: 65,
          height: 15,
          props: { content: 'PURCHASE ORDER', fontSize: 20, fontWeight: 'bold', color: '#000000', fontFamily: 'Times-Roman', align: 'right' }
        },
        {
          id: 'poNum',
          type: 'text' as const,
          x: 130,
          y: 35,
          width: 65,
          height: 10,
          props: { content: 'PO# {{poNumber}}', fontSize: 11, color: '#555555', fontFamily: 'Times-Roman', align: 'right' }
        },
        {
          id: 'dateLbl',
          type: 'text' as const,
          x: 130,
          y: 45,
          width: 65,
          height: 10,
          props: { content: 'Date: {{date}}', fontSize: 10, color: '#555555', fontFamily: 'Times-Roman', align: 'right' }
        },
        {
          id: 'deliveryLbl',
          type: 'text' as const,
          x: 130,
          y: 55,
          width: 65,
          height: 10,
          props: { content: 'Delivery: {{deliveryDate}}', fontSize: 10, color: '#555555', fontFamily: 'Times-Roman', align: 'right' }
        },
        { id: 'sep1', type: 'line' as const, x: 15, y: 68, width: 180, height: 1, props: { color: '#000000', thickness: 1 } },
        {
          id: 'vendorLbl',
          type: 'text' as const,
          x: 15,
          y: 75,
          width: 50,
          height: 8,
          props: { content: 'Vendor:', fontSize: 11, fontWeight: 'bold', color: '#000000', fontFamily: 'Times-Roman', align: 'left' }
        },
        {
          id: 'vendorName',
          type: 'text' as const,
          x: 15,
          y: 83,
          width: 80,
          height: 8,
          props: { content: '{{vendorName}}', fontSize: 11, color: '#333333', fontFamily: 'Times-Roman', align: 'left' }
        },
        {
          id: 'vendorAddr',
          type: 'text' as const,
          x: 15,
          y: 91,
          width: 80,
          height: 8,
          props: { content: '{{vendorAddress}}', fontSize: 10, color: '#555555', fontFamily: 'Times-Roman', align: 'left' }
        },
        {
          id: 'projectLbl',
          type: 'text' as const,
          x: 110,
          y: 75,
          width: 85,
          height: 8,
          props: { content: 'Project: {{projectName}}', fontSize: 10, color: '#333333', fontFamily: 'Times-Roman', align: 'right' }
        },
        {
          id: 'itemsTable',
          type: 'table' as const,
          x: 15,
          y: 110,
          width: 180,
          height: 80,
          props: {
            columns: ['Item', 'Qty', 'Unit', 'Unit Price', 'Total'],
            columnWidths: [70, 20, 20, 35, 35],
            headerBg: '#f0f0f0',
            headerColor: '#000000',
            borderColor: '#cccccc',
            fontSize: 10,
            fontFamily: 'Times-Roman'
          }
        },
        {
          id: 'subtotal',
          type: 'text' as const,
          x: 130,
          y: 195,
          width: 65,
          height: 8,
          props: { content: 'Subtotal: {{subtotal}}', fontSize: 10, color: '#333333', fontFamily: 'Times-Roman', align: 'right' }
        },
        {
          id: 'tax',
          type: 'text' as const,
          x: 130,
          y: 205,
          width: 65,
          height: 8,
          props: { content: 'Tax: {{tax}}', fontSize: 10, color: '#333333', fontFamily: 'Times-Roman', align: 'right' }
        },
        { id: 'sep2', type: 'line' as const, x: 130, y: 214, width: 65, height: 1, props: { color: '#000000', thickness: 1 } },
        {
          id: 'total',
          type: 'text' as const,
          x: 130,
          y: 218,
          width: 65,
          height: 10,
          props: { content: 'Total: {{total}}', fontSize: 14, fontWeight: 'bold', color: '#000000', fontFamily: 'Times-Roman', align: 'right' }
        },
        {
          id: 'notes',
          type: 'text' as const,
          x: 15,
          y: 245,
          width: 180,
          height: 20,
          props: { content: '{{notes}}', fontSize: 9, color: '#777777', fontFamily: 'Times-Roman', align: 'left' }
        }
      ]
    })
  },
  // 5. Professional Purchase Order
  {
    name: 'Professional Purchase Order',
    type: DocumentTemplateType.PURCHASE_ORDER,
    isDefault: true,
    layout: makePOLayout({
      elements: [
        { id: 'sideBar', type: 'shape' as const, x: 0, y: 0, width: 6, height: 297, props: { shape: 'rectangle', fill: '#0891b2' } },
        {
          id: 'company',
          type: 'text' as const,
          x: 15,
          y: 18,
          width: 100,
          height: 16,
          props: { content: '{{companyName}}', fontSize: 22, fontWeight: 'bold', color: '#0c4a6e', fontFamily: 'Helvetica', align: 'left' }
        },
        {
          id: 'companyInfo',
          type: 'text' as const,
          x: 15,
          y: 34,
          width: 100,
          height: 10,
          props: { content: '{{companyAddress}} | {{companyPhone}}', fontSize: 9, color: '#64748b', fontFamily: 'Helvetica', align: 'left' }
        },
        {
          id: 'title',
          type: 'text' as const,
          x: 130,
          y: 18,
          width: 65,
          height: 14,
          props: { content: 'PURCHASE ORDER', fontSize: 16, fontWeight: 'bold', color: '#0891b2', fontFamily: 'Helvetica', align: 'right' }
        },
        {
          id: 'poNum',
          type: 'text' as const,
          x: 130,
          y: 34,
          width: 65,
          height: 8,
          props: { content: 'PO# {{poNumber}}', fontSize: 10, color: '#64748b', fontFamily: 'Helvetica', align: 'right' }
        },
        {
          id: 'dateLbl',
          type: 'text' as const,
          x: 130,
          y: 44,
          width: 65,
          height: 8,
          props: { content: 'Date: {{date}}', fontSize: 9, color: '#64748b', fontFamily: 'Helvetica', align: 'right' }
        },
        {
          id: 'deliveryLbl',
          type: 'text' as const,
          x: 130,
          y: 53,
          width: 65,
          height: 8,
          props: { content: 'Delivery: {{deliveryDate}}', fontSize: 9, color: '#64748b', fontFamily: 'Helvetica', align: 'right' }
        },
        {
          id: 'vendorBox',
          type: 'shape' as const,
          x: 15,
          y: 65,
          width: 85,
          height: 35,
          props: { shape: 'rectangle', fill: '#f0f9ff', borderRadius: 4, borderColor: '#bae6fd', borderWidth: 1 }
        },
        {
          id: 'vendorLbl',
          type: 'text' as const,
          x: 20,
          y: 68,
          width: 75,
          height: 6,
          props: { content: 'VENDOR', fontSize: 8, fontWeight: 'bold', color: '#0891b2', fontFamily: 'Helvetica', align: 'left', letterSpacing: 1 }
        },
        {
          id: 'vendorName',
          type: 'text' as const,
          x: 20,
          y: 76,
          width: 75,
          height: 8,
          props: { content: '{{vendorName}}', fontSize: 11, fontWeight: 'bold', color: '#0c4a6e', fontFamily: 'Helvetica', align: 'left' }
        },
        {
          id: 'vendorAddr',
          type: 'text' as const,
          x: 20,
          y: 85,
          width: 75,
          height: 8,
          props: { content: '{{vendorAddress}}', fontSize: 9, color: '#64748b', fontFamily: 'Helvetica', align: 'left' }
        },
        {
          id: 'projectBox',
          type: 'shape' as const,
          x: 110,
          y: 65,
          width: 85,
          height: 35,
          props: { shape: 'rectangle', fill: '#f0f9ff', borderRadius: 4, borderColor: '#bae6fd', borderWidth: 1 }
        },
        {
          id: 'projectLbl',
          type: 'text' as const,
          x: 115,
          y: 68,
          width: 75,
          height: 6,
          props: { content: 'PROJECT', fontSize: 8, fontWeight: 'bold', color: '#0891b2', fontFamily: 'Helvetica', align: 'left', letterSpacing: 1 }
        },
        {
          id: 'projectName',
          type: 'text' as const,
          x: 115,
          y: 76,
          width: 75,
          height: 8,
          props: { content: '{{projectName}}', fontSize: 11, fontWeight: 'bold', color: '#0c4a6e', fontFamily: 'Helvetica', align: 'left' }
        },
        {
          id: 'itemsTable',
          type: 'table' as const,
          x: 15,
          y: 108,
          width: 180,
          height: 80,
          props: {
            columns: ['Item', 'Qty', 'Unit', 'Rate', 'Amount'],
            columnWidths: [70, 20, 20, 35, 35],
            headerBg: '#0891b2',
            headerColor: '#ffffff',
            borderColor: '#e2e8f0',
            fontSize: 9,
            fontFamily: 'Helvetica',
            stripedBg: '#f0f9ff'
          }
        },
        {
          id: 'subtotal',
          type: 'text' as const,
          x: 130,
          y: 195,
          width: 65,
          height: 8,
          props: { content: 'Subtotal: {{subtotal}}', fontSize: 10, color: '#475569', fontFamily: 'Helvetica', align: 'right' }
        },
        {
          id: 'tax',
          type: 'text' as const,
          x: 130,
          y: 205,
          width: 65,
          height: 8,
          props: { content: 'Tax: {{tax}}', fontSize: 10, color: '#475569', fontFamily: 'Helvetica', align: 'right' }
        },
        {
          id: 'totalBg',
          type: 'shape' as const,
          x: 130,
          y: 215,
          width: 65,
          height: 14,
          props: { shape: 'rectangle', fill: '#0891b2', borderRadius: 4 }
        },
        {
          id: 'total',
          type: 'text' as const,
          x: 130,
          y: 217,
          width: 65,
          height: 10,
          props: { content: 'Total: {{total}}', fontSize: 13, fontWeight: 'bold', color: '#ffffff', fontFamily: 'Helvetica', align: 'center' }
        },
        {
          id: 'notes',
          type: 'text' as const,
          x: 15,
          y: 245,
          width: 180,
          height: 15,
          props: { content: '{{notes}}', fontSize: 9, color: '#94a3b8', fontFamily: 'Helvetica', align: 'left' }
        }
      ]
    })
  },
  // 6. Bold Invoice
  {
    name: 'Bold Invoice',
    type: DocumentTemplateType.INVOICE,
    isDefault: true,
    layout: makeInvoiceLayout({
      elements: [
        { id: 'headerBg', type: 'shape' as const, x: 0, y: 0, width: 210, height: 55, props: { shape: 'rectangle', fill: '#111827' } },
        {
          id: 'company',
          type: 'text' as const,
          x: 15,
          y: 10,
          width: 120,
          height: 18,
          props: { content: '{{companyName}}', fontSize: 26, fontWeight: 'bold', color: '#ffffff', fontFamily: 'Helvetica', align: 'left' }
        },
        {
          id: 'companyInfo',
          type: 'text' as const,
          x: 15,
          y: 32,
          width: 120,
          height: 10,
          props: { content: '{{companyAddress}} | {{companyEmail}}', fontSize: 9, color: '#9ca3af', fontFamily: 'Helvetica', align: 'left' }
        },
        {
          id: 'titleBadge',
          type: 'shape' as const,
          x: 145,
          y: 12,
          width: 50,
          height: 16,
          props: { shape: 'rectangle', fill: '#f59e0b', borderRadius: 8 }
        },
        {
          id: 'title',
          type: 'text' as const,
          x: 145,
          y: 14,
          width: 50,
          height: 12,
          props: { content: 'INVOICE', fontSize: 12, fontWeight: 'bold', color: '#111827', fontFamily: 'Helvetica', align: 'center' }
        },
        {
          id: 'invoiceNum',
          type: 'text' as const,
          x: 145,
          y: 34,
          width: 50,
          height: 8,
          props: { content: '#{{invoiceNumber}}', fontSize: 10, color: '#9ca3af', fontFamily: 'Helvetica', align: 'center' }
        },
        {
          id: 'infoRow',
          type: 'shape' as const,
          x: 15,
          y: 62,
          width: 180,
          height: 30,
          props: { shape: 'rectangle', fill: '#f9fafb', borderRadius: 6 }
        },
        {
          id: 'billTo',
          type: 'text' as const,
          x: 20,
          y: 65,
          width: 80,
          height: 6,
          props: { content: 'BILL TO', fontSize: 8, fontWeight: 'bold', color: '#f59e0b', fontFamily: 'Helvetica', align: 'left', letterSpacing: 1 }
        },
        {
          id: 'clientName',
          type: 'text' as const,
          x: 20,
          y: 73,
          width: 80,
          height: 8,
          props: { content: '{{clientName}}', fontSize: 12, fontWeight: 'bold', color: '#111827', fontFamily: 'Helvetica', align: 'left' }
        },
        {
          id: 'clientAddr',
          type: 'text' as const,
          x: 20,
          y: 82,
          width: 80,
          height: 6,
          props: { content: '{{clientAddress}}', fontSize: 9, color: '#6b7280', fontFamily: 'Helvetica', align: 'left' }
        },
        {
          id: 'dateInfo',
          type: 'text' as const,
          x: 120,
          y: 65,
          width: 70,
          height: 6,
          props: { content: 'Date: {{date}}', fontSize: 9, color: '#6b7280', fontFamily: 'Helvetica', align: 'right' }
        },
        {
          id: 'dueInfo',
          type: 'text' as const,
          x: 120,
          y: 75,
          width: 70,
          height: 6,
          props: { content: 'Due: {{dueDate}}', fontSize: 9, color: '#6b7280', fontFamily: 'Helvetica', align: 'right' }
        },
        {
          id: 'itemsTable',
          type: 'table' as const,
          x: 15,
          y: 100,
          width: 180,
          height: 80,
          props: {
            columns: ['Description', 'Qty', 'Rate', 'Amount'],
            columnWidths: [90, 25, 35, 30],
            headerBg: '#111827',
            headerColor: '#f59e0b',
            borderColor: '#e5e7eb',
            fontSize: 9,
            fontFamily: 'Helvetica',
            stripedBg: '#f9fafb'
          }
        },
        {
          id: 'subtotal',
          type: 'text' as const,
          x: 130,
          y: 190,
          width: 65,
          height: 8,
          props: { content: 'Subtotal: {{subtotal}}', fontSize: 10, color: '#4b5563', fontFamily: 'Helvetica', align: 'right' }
        },
        {
          id: 'tax',
          type: 'text' as const,
          x: 130,
          y: 200,
          width: 65,
          height: 8,
          props: { content: 'Tax: {{tax}}', fontSize: 10, color: '#4b5563', fontFamily: 'Helvetica', align: 'right' }
        },
        {
          id: 'totalBg',
          type: 'shape' as const,
          x: 130,
          y: 210,
          width: 65,
          height: 16,
          props: { shape: 'rectangle', fill: '#f59e0b', borderRadius: 6 }
        },
        {
          id: 'total',
          type: 'text' as const,
          x: 130,
          y: 213,
          width: 65,
          height: 10,
          props: { content: '{{total}}', fontSize: 16, fontWeight: 'bold', color: '#111827', fontFamily: 'Helvetica', align: 'center' }
        },
        {
          id: 'totalLabel',
          type: 'text' as const,
          x: 85,
          y: 215,
          width: 40,
          height: 8,
          props: { content: 'TOTAL DUE', fontSize: 9, fontWeight: 'bold', color: '#111827', fontFamily: 'Helvetica', align: 'right' }
        },
        {
          id: 'notes',
          type: 'text' as const,
          x: 15,
          y: 240,
          width: 180,
          height: 15,
          props: { content: '{{notes}}', fontSize: 9, color: '#9ca3af', fontFamily: 'Helvetica', align: 'left' }
        }
      ]
    })
  }
];

class DocumentTemplateService {
  public async createTemplate(data: any, userId?: string): Promise<DocumentTemplate> {
    return await DocumentTemplate.create({ ...data, userId });
  }

  public async updateTemplate(id: string, data: any): Promise<DocumentTemplate> {
    const template = await DocumentTemplate.findByPk(id);
    if (!template) throw new BaseError(ERRORS.DOCUMENT_TEMPLATE_NOT_FOUND);
    await template.update(data);
    return template;
  }

  public async getTemplates(query: any): Promise<any> {
    const { page, limit, offset } = clampPagination(query);
    const { type, searchKey } = query;

    const where: any = {};
    if (type) where.type = type;
    if (searchKey) {
      where.name = { [Op.iLike]: `%${searchKey}%` };
    }

    const { rows: docs, count: totalItems } = await DocumentTemplate.findAndCountAll({
      where,
      limit,
      offset,
      order: [
        ['isDefault', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });

    return {
      docs,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }

  public async getTemplateById(id: string): Promise<DocumentTemplate> {
    const template = await DocumentTemplate.findByPk(id);
    if (!template) throw new BaseError(ERRORS.DOCUMENT_TEMPLATE_NOT_FOUND);
    return template;
  }

  public async deleteTemplate(id: string): Promise<void> {
    const template = await DocumentTemplate.findByPk(id);
    if (!template) throw new BaseError(ERRORS.DOCUMENT_TEMPLATE_NOT_FOUND);
    await template.destroy();
  }

  public async cloneTemplate(id: string, userId?: string): Promise<DocumentTemplate> {
    const template = await DocumentTemplate.findByPk(id);
    if (!template) throw new BaseError(ERRORS.DOCUMENT_TEMPLATE_NOT_FOUND);

    const cloned = await DocumentTemplate.create({
      name: `${template.name} (Copy)`,
      type: template.type,
      layout: template.layout,
      headerConfig: template.headerConfig,
      footerConfig: template.footerConfig,
      tableConfig: template.tableConfig,
      isDefault: false,
      userId
    });
    return cloned;
  }

  public async seedDefaults(): Promise<void> {
    const count = await DocumentTemplate.count({ where: { isDefault: true } });
    if (count >= DEFAULT_TEMPLATES.length) return;

    for (const tpl of DEFAULT_TEMPLATES) {
      const exists = await DocumentTemplate.findOne({
        where: { name: tpl.name, isDefault: true }
      });
      if (!exists) {
        await DocumentTemplate.create(tpl);
      }
    }
  }

  public getDefaultTemplateConfigs() {
    return DEFAULT_TEMPLATES;
  }
}

export default new DocumentTemplateService();
