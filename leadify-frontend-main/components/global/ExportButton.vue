import logger from '~/utils/logger'
<template lang="pug">
el-dropdown(trigger="click" @command="handleExport" :disabled="isExporting")
  el-button(size="large" class="premium-btn-secondary" :loading="isExporting")
    Icon(v-if="!isExporting" name="IconExport" size="20")
    span.mx-1 {{ isExporting ? $t('export.exporting') : $t('common.export') }}
  template(#dropdown)
    el-dropdown-menu
      el-dropdown-item(command="csv")
        .flex.items-center
          Icon(name="ph:file-csv-bold" size="16" class="mr-2")
          span {{ $t('export.csv') }}
      el-dropdown-item(command="xlsx")
        .flex.items-center
          Icon(name="ph:file-xls-bold" size="16" class="mr-2")
          span {{ $t('export.excel') }}
      el-dropdown-item(command="pdf")
        .flex.items-center
          Icon(name="ph:file-pdf-bold" size="16" class="mr-2")
          span {{ $t('export.pdf') }}
</template>

<script setup lang="ts">
const { t } = useI18n();
const { exportToPDF, exportToCSV, exportToExcel, exporting: composableExporting } = useExport();

const props = defineProps<{
  data?: Record<string, unknown>[];
  columns?: { prop: string; label: string }[];
  filename?: string;
  apiEndpoint?: string;
  companyName?: string;
  title?: string;
  /** When true, PDF is generated server-side via Puppeteer (higher quality) */
  serverPdf?: boolean;
}>();

const emit = defineEmits<{
  export: [format: string];
}>();

const localExporting = ref(false);
const isExporting = computed(() => localExporting.value || composableExporting.value);

async function handleExport(format: string) {
  emit('export', format);

  if (props.data && props.columns) {
    await exportClientSide(format);
  }
}

function getColumnKeys(): string[] {
  return props.columns?.map(c => c.prop) || [];
}

function getColumnLabels(): Record<string, string> {
  const labels: Record<string, string> = {};
  if (props.columns) {
    for (const col of props.columns) {
      labels[col.prop] = col.label;
    }
  }
  return labels;
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
      if (typeof val === 'object' && (val as Record<string, unknown>).title) return (val as Record<string, unknown>).title as string;
      if (typeof val === 'object' && (val as Record<string, unknown>).name) return (val as Record<string, unknown>).name as string;
      return String(val);
    })
  );
}

async function exportClientSide(format: string) {
  if (!props.data || !props.columns) return;

  localExporting.value = true;
  const baseName = props.filename || 'export';

  try {
    if (format === 'csv') {
      exportToCSV(props.title || baseName, props.data, getColumnKeys(), { columnLabels: getColumnLabels(), filename: `${baseName}.csv` });
    } else if (format === 'xlsx') {
      await exportToExcel(props.title || baseName, props.data, getColumnKeys(), { columnLabels: getColumnLabels(), filename: `${baseName}.xlsx` });
    } else if (format === 'pdf') {
      if (props.serverPdf) {
        // Use server-side PDF generation (Puppeteer - higher quality)
        await exportToPDF(props.title || baseName, props.data, getColumnKeys(), { columnLabels: getColumnLabels(), filename: `${baseName}.pdf` });
      } else {
        // Use existing client-side PDF generation (jspdf)
        await exportPDFLegacy(getHeaders(), getRows(), baseName);
      }
    }

    ElMessage.success(t('export.success'));
  } catch (err) {
    logger.error('Export failed:', err);
    ElMessage.error(t('export.failed'));
  } finally {
    localExporting.value = false;
  }
}

async function loadLogoBase64(): Promise<string | null> {
  try {
    const response = await fetch('/assets/header-logo.png');
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function exportPDFLegacy(headers: string[], rows: string[][], baseName: string) {
  try {
    const { default: JsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const isLandscape = rows[0] && rows[0].length > 5;
    const doc = new JsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageW = doc.internal.pageSize.getWidth();
    const logoBase64 = await loadLogoBase64();

    // Header band
    doc.setFillColor(120, 73, 255);
    doc.rect(0, 0, pageW, 28, 'F');

    // Logo (left side)
    let logoEndX = 14;
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', 10, 4, 40, 18);
        logoEndX = 56;
      } catch {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(props.companyName || 'High Point Technology', 12, 17);
        logoEndX = 70;
      }
    } else {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(props.companyName || 'High Point Technology', 12, 17);
      logoEndX = 70;
    }

    // Report title (right side of logo)
    const title = props.title || baseName;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(title, logoEndX + 4, 13);

    // Generated date below title
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(220, 210, 255);
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, logoEndX + 4, 20);

    // Thin accent line below header
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.line(0, 28, pageW, 28);

    const startY = 34;
    doc.setTextColor(0, 0, 0);

    // Table
    autoTable(doc, {
      startY,
      head: [headers],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [120, 73, 255],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left' as const
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
        overflow: 'linebreak' as const
      },
      margin: { left: 10, right: 10 },
      didDrawPage: (data: unknown) => {
        const pageCount = (doc as unknown as Record<string, Record<string, () => number>>).internal.getNumberOfPages();
        const ph = doc.internal.pageSize.getHeight();
        // Footer line
        doc.setDrawColor(220, 220, 230);
        doc.setLineWidth(0.2);
        doc.line(10, ph - 12, pageW - 10, ph - 12);
        // Company name left, page number right
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(props.companyName || 'High Point Technology', 10, ph - 6);
        doc.text(`Page ${(data as Record<string, number>).pageNumber} of ${pageCount}`, pageW - 10, ph - 6, { align: 'right' });
      }
    });

    doc.save(`${baseName}.pdf`);
  } catch (err) {
    logger.error('PDF export failed:', err);
  }
}
</script>
