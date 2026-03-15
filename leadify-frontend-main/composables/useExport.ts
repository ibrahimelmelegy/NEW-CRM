import logger from '~/utils/logger'
/**
 * useExport composable
 *
 * Provides unified export functions for PDF, CSV, and Excel.
 * - PDF: Server-side generation via Puppeteer (high quality), with client-side jspdf fallback
 * - CSV: Client-side generation (fast, no server round-trip)
 * - Excel: Client-side generation using SheetJS (xlsx)
 */

export function useExport() {
  const exporting = ref(false);
  const exportError = ref<string | null>(null);

  // ─── Server-side PDF Export ──────────────────────────────
  /**
   * Generate a PDF on the server and download it.
   * Falls back to client-side generation if server is unavailable.
   */
  async function exportToPDF(
    title: string,
    data: Record<string, unknown>[],
    columns: string[],
    options?: {
      columnLabels?: Record<string, string>;
      summary?: Record<string, { sum: number; avg: number; min: number; max: number; count: number }>;
      filename?: string;
    }
  ): Promise<void> {
    if (!data.length || !columns.length) return;

    exporting.value = true;
    exportError.value = null;

    try {
      const config = useRuntimeConfig();
      const response = await fetch(`${config.public.API_BASE_URL}report-builder/export-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          data,
          columns,
          columnLabels: options?.columnLabels,
          summary: options?.summary
        })
      });

      if (!response.ok) {
        throw new Error(`Server PDF generation failed (${response.status})`);
      }

      const blob = await response.blob();
      downloadBlob(blob, options?.filename || `${title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    } catch (err) {
      logger.warn('Server-side PDF failed, falling back to client-side:', err);
      // Fallback to client-side PDF generation
      await exportToPDFClientSide(title, data, columns, options?.filename);
    } finally {
      exporting.value = false;
    }
  }

  /**
   * Generate a PDF client-side using jspdf + autotable.
   */
  async function exportToPDFClientSide(title: string, data: Record<string, unknown>[], columns: string[], filename?: string): Promise<void> {
    try {
      const { default: JsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const isLandscape = columns.length > 5;
      const doc = new JsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageW = doc.internal.pageSize.getWidth();

      // Header band
      doc.setFillColor(120, 73, 255);
      doc.rect(0, 0, pageW, 24, 'F');

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(title, 14, 12);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(220, 210, 255);
      doc.text(`Generated: ${new Date().toLocaleDateString()} | ${data.length} records`, 14, 19);

      const headers = columns;
      const tableData = data.map(row =>
        headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          return String(val);
        })
      );

      doc.setTextColor(0, 0, 0);

      autoTable(doc, {
        startY: 30,
        head: [headers],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [120, 73, 255],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 7, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: [248, 248, 255] },
        styles: {
          lineColor: [220, 220, 230],
          lineWidth: 0.15,
          overflow: 'linebreak' as const
        },
        margin: { left: 10, right: 10 },
        didDrawPage: (pageData: unknown) => {
          const ph = doc.internal.pageSize.getHeight();
          doc.setDrawColor(220, 220, 230);
          doc.setLineWidth(0.2);
          doc.line(10, ph - 10, pageW - 10, ph - 10);
          doc.setFontSize(7);
          doc.setTextColor(150);
          doc.text(title, 10, ph - 5);
          doc.text(`Page ${(pageData as Record<string, number>).pageNumber}`, pageW - 10, ph - 5, { align: 'right' });
        }
      });

      doc.save(filename || `${title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    } catch (err) {
      exportError.value = 'PDF export failed';
      logger.error('Client-side PDF export failed:', err);
    }
  }

  // ─── CSV Export ──────────────────────────────────────────
  /**
   * Generate a CSV file client-side and download it.
   */
  function exportToCSV(
    title: string,
    data: Record<string, unknown>[],
    columns: string[],
    options?: { columnLabels?: Record<string, string>; filename?: string }
  ): void {
    if (!data.length || !columns.length) return;

    exporting.value = true;
    exportError.value = null;

    try {
      const labels = options?.columnLabels || {};
      const headerRow = columns.map(c => labels[c] || c);
      const rows = data.map(row =>
        columns
          .map(col => {
            const val = row[col];
            if (val === null || val === undefined) return '';
            const str = String(val);
            // Escape CSV special characters
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',')
      );

      const csvContent = [headerRow.join(','), ...rows].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, options?.filename || `${title.replace(/\s+/g, '-').toLowerCase()}.csv`);
    } catch (err) {
      exportError.value = 'CSV export failed';
      logger.error('CSV export failed:', err);
    } finally {
      exporting.value = false;
    }
  }

  // ─── Excel Export ────────────────────────────────────────
  /**
   * Generate an Excel file client-side using SheetJS and download it.
   */
  async function exportToExcel(
    title: string,
    data: Record<string, unknown>[],
    columns: string[],
    options?: { columnLabels?: Record<string, string>; filename?: string }
  ): Promise<void> {
    if (!data.length || !columns.length) return;

    exporting.value = true;
    exportError.value = null;

    try {
      // Build CSV content and download as .xlsx-compatible format using a Blob.
      // This avoids the vulnerable xlsx (SheetJS) package while keeping the same UX.
      const labels = options?.columnLabels || {};
      const headerRow = columns.map(c => labels[c] || c);
      const rows = [headerRow, ...data.map(row => columns.map(col => String(row[col] ?? '')))];
      const csvContent = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = options?.filename || `${title.replace(/\s+/g, '-').toLowerCase()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      exportError.value = 'Excel export failed';
      logger.error('Excel export failed:', err);
    } finally {
      exporting.value = false;
    }
  }

  // ─── Server-side Report Export (by saved report ID) ─────
  /**
   * Export a saved report by ID in a given format.
   */
  async function exportSavedReport(reportId: number | string, format: 'csv' | 'xlsx' | 'pdf', filename?: string): Promise<void> {
    exporting.value = true;
    exportError.value = null;

    try {
      const config = useRuntimeConfig();

      if (format === 'pdf') {
        // Use POST endpoint for PDF generation
        const response = await fetch(`${config.public.API_BASE_URL}reports/${reportId}/export`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ format: 'pdf' })
        });

        if (!response.ok) throw new Error(`Export failed (${response.status})`);
        const blob = await response.blob();
        downloadBlob(blob, filename || `report-${reportId}.pdf`);
        return;
      }

      // For CSV, use the GET endpoint
      const response = await fetch(`${config.public.API_BASE_URL}reports/${reportId}/export/${format}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) throw new Error(`Export failed (${response.status})`);

      const blob = await response.blob();
      const ext = format === 'xlsx' ? 'xlsx' : 'csv';
      downloadBlob(blob, filename || `report-${reportId}.${ext}`);
    } catch (err) {
      exportError.value = `${format.toUpperCase()} export failed`;
      logger.error('Report export failed:', err);
    } finally {
      exporting.value = false;
    }
  }

  // ─── Server-side Config Export ──────────────────────────
  /**
   * Export report data from a builder configuration (no saved report needed).
   */
  async function exportFromConfig(config: Record<string, unknown>, format: 'csv' | 'pdf', title?: string): Promise<void> {
    exporting.value = true;
    exportError.value = null;

    try {
      const runtimeConfig = useRuntimeConfig();
      const response = await fetch(`${runtimeConfig.public.API_BASE_URL}reports/builder/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ config, format, title })
      });

      if (!response.ok) throw new Error(`Export failed (${response.status})`);

      if (format === 'csv') {
        const blob = await response.blob();
        downloadBlob(blob, `${(title || 'report').replace(/\s+/g, '-').toLowerCase()}.csv`);
      } else if (format === 'pdf') {
        const blob = await response.blob();
        downloadBlob(blob, `${(title || 'report').replace(/\s+/g, '-').toLowerCase()}.pdf`);
      }
    } catch (err) {
      exportError.value = `${format.toUpperCase()} export failed`;
      logger.error('Config export failed:', err);
    } finally {
      exporting.value = false;
    }
  }

  // ─── Utility ────────────────────────────────────────────
  function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return {
    exporting,
    exportError,
    exportToPDF,
    exportToPDFClientSide,
    exportToCSV,
    exportToExcel,
    exportSavedReport,
    exportFromConfig,
    downloadBlob
  };
}
