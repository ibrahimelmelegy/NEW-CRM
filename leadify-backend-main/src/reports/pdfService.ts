/**
 * Report PDF Generation Service
 *
 * Generates styled PDF reports from tabular data using Puppeteer.
 * Falls back to returning HTML as a buffer if Puppeteer is unavailable.
 */

interface PdfReportOptions {
  title: string;
  subtitle?: string;
  data: Record<string, unknown>[];
  columns: string[];
  columnLabels?: Record<string, string>;
  summary?: Record<string, { sum: number; avg: number; min: number; max: number; count: number }>;
  orientation?: 'portrait' | 'landscape';
  companyName?: string;
}

class ReportPdfService {
  /**
   * Generate a PDF buffer from report data.
   * Returns the raw Buffer for streaming directly as an HTTP response.
   */
  async generateReportPdf(options: PdfReportOptions): Promise<Buffer> {
    const html = this.buildReportHtml(options);

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: options.orientation === 'landscape' || options.columns.length > 5,
        printBackground: true,
        margin: { top: '15mm', right: '10mm', bottom: '15mm', left: '10mm' }
      });

      await browser.close();
      return Buffer.from(pdfBuffer);
    } catch {
      // Fallback: return HTML buffer
      return Buffer.from(html);
    }
  }

  /**
   * Build an HTML string for the report.
   */
  private buildReportHtml(options: PdfReportOptions): string {
    const { title, subtitle, data, columns, columnLabels, summary, companyName = 'Leadify CRM' } = options;

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const getLabel = (col: string): string => {
      if (columnLabels && columnLabels[col]) return columnLabels[col];
      // Convert camelCase to Title Case
      return col
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, s => s.toUpperCase())
        .trim();
    };

    const escapeHtml = (val: any): string => {
      if (val === null || val === undefined) return '-';
      const str = String(val);
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };

    // Build table header
    const headerCells = columns.map(col => `<th>${escapeHtml(getLabel(col))}</th>`).join('');

    // Build table rows
    const bodyRows = data
      .map((row, idx) => {
        const cells = columns.map(col => `<td>${escapeHtml(row[col])}</td>`).join('');
        return `<tr class="${idx % 2 === 0 ? 'even' : 'odd'}">${cells}</tr>`;
      })
      .join('');

    // Build summary section
    let summaryHtml = '';
    if (summary && Object.keys(summary).length > 0) {
      const summaryRows = Object.entries(summary)
        .map(
          ([field, stats]) => `
        <tr>
          <td class="field-name">${escapeHtml(getLabel(field))}</td>
          <td>${stats.count.toLocaleString()}</td>
          <td>${stats.sum.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
          <td>${stats.avg.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
          <td>${stats.min.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
          <td>${stats.max.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
        </tr>
      `
        )
        .join('');

      summaryHtml = `
        <div class="summary-section">
          <h3>Summary Statistics</h3>
          <table class="summary-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Count</th>
                <th>Sum</th>
                <th>Average</th>
                <th>Min</th>
                <th>Max</th>
              </tr>
            </thead>
            <tbody>${summaryRows}</tbody>
          </table>
        </div>
      `;
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; font-size: 10px; }

    .header {
      background: linear-gradient(135deg, #7849ff, #6a3ae0);
      color: white;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-left h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
    .header-left .subtitle { font-size: 11px; opacity: 0.85; }
    .header-right { text-align: right; font-size: 9px; opacity: 0.8; }
    .header-right .company { font-size: 11px; font-weight: 600; opacity: 1; }

    .meta-bar {
      background: #f8f7ff;
      border-bottom: 1px solid #e8e5f5;
      padding: 8px 20px;
      display: flex;
      gap: 20px;
      font-size: 9px;
      color: #666;
    }
    .meta-bar strong { color: #7849ff; }

    .content { padding: 12px 20px; }

    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
      margin-top: 8px;
    }
    table.data-table th {
      background: #7849ff;
      color: white;
      padding: 6px 8px;
      text-align: left;
      font-weight: 600;
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      white-space: nowrap;
    }
    table.data-table td {
      padding: 5px 8px;
      border-bottom: 1px solid #eee;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    table.data-table tr.odd { background: #fafafa; }
    table.data-table tr:hover { background: #f0edff; }

    .summary-section {
      margin-top: 16px;
      page-break-inside: avoid;
    }
    .summary-section h3 {
      font-size: 12px;
      color: #7849ff;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 2px solid #7849ff;
    }
    table.summary-table {
      width: auto;
      border-collapse: collapse;
      font-size: 9px;
    }
    table.summary-table th {
      background: #f0edff;
      color: #5a2dc7;
      padding: 5px 12px;
      text-align: right;
      font-weight: 600;
      font-size: 8px;
      text-transform: uppercase;
    }
    table.summary-table th:first-child { text-align: left; }
    table.summary-table td {
      padding: 5px 12px;
      text-align: right;
      border-bottom: 1px solid #eee;
    }
    table.summary-table td.field-name { text-align: left; font-weight: 500; }

    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 6px 20px;
      border-top: 1px solid #e8e5f5;
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${escapeHtml(title)}</h1>
      ${subtitle ? `<div class="subtitle">${escapeHtml(subtitle)}</div>` : ''}
    </div>
    <div class="header-right">
      <div class="company">${escapeHtml(companyName)}</div>
      <div>${dateStr} at ${timeStr}</div>
    </div>
  </div>

  <div class="meta-bar">
    <span>Total Records: <strong>${data.length.toLocaleString()}</strong></span>
    <span>Columns: <strong>${columns.length}</strong></span>
    <span>Generated: <strong>${dateStr}</strong></span>
  </div>

  <div class="content">
    <table class="data-table">
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>

    ${summaryHtml}
  </div>

  <div class="footer">
    <span>${escapeHtml(companyName)}</span>
    <span>Report: ${escapeHtml(title)}</span>
  </div>
</body>
</html>`;
  }
}

export default new ReportPdfService();
