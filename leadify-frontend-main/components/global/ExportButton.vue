<template lang="pug">
el-dropdown(trigger="click" @command="handleExport")
  el-button(size="large" class="premium-btn-secondary")
    Icon(name="IconExport" size="20")
    span.mx-1 {{ $t('common.export') }}
  template(#dropdown)
    el-dropdown-menu
      el-dropdown-item(command="csv")
        .flex.items-center
          Icon(name="ph:file-csv-bold" size="16" class="mr-2")
          span CSV
      el-dropdown-item(command="xlsx")
        .flex.items-center
          Icon(name="ph:file-xls-bold" size="16" class="mr-2")
          span Excel (.xlsx)
      el-dropdown-item(command="pdf")
        .flex.items-center
          Icon(name="ph:file-pdf-bold" size="16" class="mr-2")
          span PDF
</template>

<script setup lang="ts">
const props = defineProps<{
  data?: any[];
  columns?: { prop: string; label: string }[];
  filename?: string;
  apiEndpoint?: string;
  companyName?: string;
  title?: string;
}>();

const emit = defineEmits<{
  export: [format: string];
}>();

async function handleExport(format: string) {
  emit('export', format);

  if (props.data && props.columns) {
    exportClientSide(format);
  }
}

function getHeaders(): string[] {
  return props.columns?.map(c => c.label) || [];
}

function getRows(): string[][] {
  if (!props.data || !props.columns) return [];
  return props.data.map(row =>
    props.columns!.map(c => {
      const val = row[c.prop];
      if (val === null || val === undefined) return '';
      if (typeof val === 'object' && val.title) return val.title;
      if (typeof val === 'object' && val.name) return val.name;
      return String(val);
    })
  );
}

function exportClientSide(format: string) {
  if (!props.data || !props.columns) return;

  const headers = getHeaders();
  const rows = getRows();
  const baseName = props.filename || 'export';

  if (format === 'csv') {
    exportCSV(headers, rows, baseName);
  } else if (format === 'xlsx') {
    exportExcel(headers, rows, baseName);
  } else if (format === 'pdf') {
    exportPDF(headers, rows, baseName);
  }
}

function exportCSV(headers: string[], rows: string[][], baseName: string) {
  const csvContent = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  downloadFile(csvContent, `${baseName}.csv`, 'text/csv');
}

async function exportExcel(headers: string[], rows: string[][], baseName: string) {
  try {
    // Try using SheetJS (xlsx) if available
    const XLSX = await import('xlsx').catch(() => null);
    if (XLSX) {
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

      // Auto-size columns
      const colWidths = headers.map((h, i) => {
        const maxLen = Math.max(
          h.length,
          ...rows.map(r => String(r[i] || '').length)
        );
        return { wch: Math.min(maxLen + 2, 50) };
      });
      worksheet['!cols'] = colWidths;

      XLSX.writeFile(workbook, `${baseName}.xlsx`);
      return;
    }
  } catch {
    // SheetJS not available, fall back to CSV with xls extension
  }

  // Fallback: export as CSV with .xls extension (opens in Excel)
  const csvContent = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join('\t'))
    .join('\n');
  downloadFile(csvContent, `${baseName}.xls`, 'application/vnd.ms-excel');
}

async function exportPDF(headers: string[], rows: string[][], baseName: string) {
  try {
    const jsPDF = (await import('jspdf')).default;
    await import('jspdf-autotable');

    const doc = new jsPDF({
      orientation: rows[0] && rows[0].length > 5 ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let startY = 15;

    // Optional company header
    if (props.companyName) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(props.companyName, doc.internal.pageSize.getWidth() / 2, startY, { align: 'center' });
      startY += 10;
    }

    // Title
    const title = props.title || baseName;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, doc.internal.pageSize.getWidth() / 2, startY, { align: 'center' });
    startY += 4;

    // Date
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      doc.internal.pageSize.getWidth() / 2,
      startY,
      { align: 'center' }
    );
    startY += 8;
    doc.setTextColor(0, 0, 0);

    // Table
    (doc as any).autoTable({
      startY,
      head: [headers],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [120, 73, 255], // accent-color #7849ff
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left'
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [248, 248, 255]
      },
      styles: {
        lineColor: [220, 220, 230],
        lineWidth: 0.2,
        overflow: 'linebreak'
      },
      margin: { left: 10, right: 10 },
      didDrawPage: (data: any) => {
        // Footer with page number
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'center' }
        );
      }
    });

    doc.save(`${baseName}.pdf`);
  } catch (err) {
    console.error('PDF export failed:', err);
  }
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob(['\ufeff' + content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
</script>
