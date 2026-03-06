import JsPDF from 'jspdf';
import 'jspdf-autotable';
import type { TemplateLayout, TemplateElement } from '~/composables/useDocumentTemplates';

export interface PDFData {
  [key: string]: unknown;
  items?: Array<Record<string, unknown>>;
}

function resolveVariable(content: string, data: PDFData): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => {
    const val = data[key];
    return val != null ? String(val) : '';
  });
}

export function generatePDF(layout: TemplateLayout, data: PDFData, filename?: string) {
  const isLandscape = layout.orientation === 'landscape';
  const doc = new JsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const sortedElements = [...layout.elements].sort((a, b) => {
    const order: Record<string, number> = { shape: 0, line: 1, image: 2, table: 3, text: 4 };
    return (order[a.type] || 5) - (order[b.type] || 5);
  });

  for (const el of sortedElements) {
    renderElement(doc, el, data);
  }

  const name = filename || 'document.pdf';
  doc.save(name);
}

function renderElement(doc: JsPDF, el: TemplateElement, data: PDFData) {
  switch (el.type) {
    case 'shape':
      renderShape(doc, el);
      break;
    case 'line':
      renderLine(doc, el);
      break;
    case 'text':
      renderText(doc, el, data);
      break;
    case 'table':
      renderTable(doc, el, data);
      break;
    case 'image':
      // Image rendering requires base64 data - skip placeholders
      break;
  }
}

function renderShape(doc: JsPDF, el: TemplateElement) {
  const fill = el.props?.fill;
  if (fill) {
    const rgb = hexToRgb(fill);
    doc.setFillColor(rgb.r, rgb.g, rgb.b);
  }

  const radius = el.props?.borderRadius || 0;
  const isCircle = el.props?.shape === 'circle';

  if (el.props?.borderWidth && el.props?.borderColor) {
    const bc = hexToRgb(el.props.borderColor);
    doc.setDrawColor(bc.r, bc.g, bc.b);
    doc.setLineWidth(el.props.borderWidth);
  }

  if (isCircle) {
    const rx = el.width / 2;
    const ry = el.height / 2;
    doc.ellipse(el.x + rx, el.y + ry, rx, ry, fill ? 'F' : 'S');
  } else if (radius > 0) {
    doc.roundedRect(el.x, el.y, el.width, el.height, radius, radius, fill ? 'F' : 'S');
  } else {
    doc.rect(el.x, el.y, el.width, el.height, fill ? 'F' : 'S');
  }
}

function renderLine(doc: JsPDF, el: TemplateElement) {
  const color = hexToRgb(el.props?.color || '#000000');
  doc.setDrawColor(color.r, color.g, color.b);
  doc.setLineWidth(el.props?.thickness || 0.5);
  doc.line(el.x, el.y, el.x + el.width, el.y);
}

function renderText(doc: JsPDF, el: TemplateElement, data: PDFData) {
  const content = resolveVariable(el.props?.content || '', data);
  if (!content) return;

  const fontSize = el.props?.fontSize || 10;
  const fontFamily = el.props?.fontFamily || 'helvetica';
  const fontWeight = el.props?.fontWeight === 'bold' ? 'bold' : 'normal';
  const color = hexToRgb(el.props?.color || '#000000');
  const align = el.props?.align || 'left';

  doc.setFont(mapFont(fontFamily), fontWeight);
  doc.setFontSize(fontSize);
  doc.setTextColor(color.r, color.g, color.b);

  let textX = el.x;
  if (align === 'center') textX = el.x + el.width / 2;
  else if (align === 'right') textX = el.x + el.width;

  doc.text(content, textX, el.y + fontSize * 0.35, {
    align: align as any,
    maxWidth: el.width
  });
}

function renderTable(doc: JsPDF, el: TemplateElement, data: PDFData) {
  const columns = el.props?.columns || [];
  const items = data.items || [];
  const columnWidths = el.props?.columnWidths;

  const head = [columns];
  const body = items.map((item: Record<string, unknown>) =>
    columns.map((col: string) => {
      const key = col.toLowerCase().replace(/\s+/g, '');
      return item[key] ?? item[col] ?? '';
    })
  );

  const headerBg = hexToRgb(el.props?.headerBg || '#f0f0f0');
  const headerColor = hexToRgb(el.props?.headerColor || '#000000');
  const borderColor = hexToRgb(el.props?.borderColor || '#cccccc');

  (doc as any).autoTable({
    startY: el.y,
    margin: { left: el.x },
    tableWidth: el.width,
    head,
    body: body.length ? body : [columns.map(() => '---')],
    headStyles: {
      fillColor: [headerBg.r, headerBg.g, headerBg.b],
      textColor: [headerColor.r, headerColor.g, headerColor.b],
      fontSize: el.props?.fontSize || 9,
      font: mapFont(el.props?.fontFamily || 'helvetica')
    },
    bodyStyles: {
      fontSize: el.props?.fontSize || 9,
      font: mapFont(el.props?.fontFamily || 'helvetica')
    },
    styles: {
      lineColor: [borderColor.r, borderColor.g, borderColor.b],
      lineWidth: 0.2
    },
    ...(columnWidths && {
      columnStyles: columnWidths.reduce((acc: Record<number, { cellWidth: number }>, w: number, i: number) => {
        acc[i] = { cellWidth: w };
        return acc;
      }, {})
    }),
    alternateRowStyles: el.props?.stripedBg ? { fillColor: hexToRgbArray(el.props.stripedBg) } : undefined
  });
}

function mapFont(family: string): string {
  const lower = family.toLowerCase();
  if (lower.includes('times')) return 'times';
  if (lower.includes('courier')) return 'courier';
  return 'helvetica';
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1]!, 16),
    g: parseInt(result[2]!, 16),
    b: parseInt(result[3]!, 16)
  };
}

function hexToRgbArray(hex: string): number[] {
  const { r, g, b } = hexToRgb(hex);
  return [r, g, b];
}
