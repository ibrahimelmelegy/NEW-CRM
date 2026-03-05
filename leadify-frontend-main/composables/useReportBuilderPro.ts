import * as XLSX from 'xlsx';

// ─── Types ───────────────────────────────────────────────────

export interface FieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  icon: string;
  options?: string[];
  module?: string;
}

export interface ModuleDefinition {
  key: string;
  label: string;
  icon: string;
  fields: FieldDefinition[];
}

export interface ReportFilter {
  field: string;
  operator: string;
  value: unknown;
  fieldType?: string;
}

export interface ChartConfig {
  xAxis?: string;
  yAxis?: string;
  colorScheme?: string;
  stacked?: boolean;
  showLegend?: boolean;
  showValues?: boolean;
}

export interface ScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  recipients: string[];
  format: 'pdf' | 'excel';
}

export interface ReportBuilderProConfig {
  modules: string[];
  fields: string[];
  filters: ReportFilter[];
  groupBy: string;
  aggregations: { field: string; function: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX' }[];
  chartType: string;
  chartConfig: ChartConfig;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  schedule: ScheduleConfig | null;
}

export interface ReportSummary {
  [field: string]: {
    sum: number;
    avg: number;
    min: number;
    max: number;
    count: number;
  };
}

// ─── Module Field Definitions (client-side) ──────────────────

export const MODULE_DEFINITIONS: Record<string, ModuleDefinition> = {
  leads: {
    key: 'leads',
    label: 'Leads',
    icon: 'ph:user-plus',
    fields: [
      { name: 'name', label: 'Name', type: 'text', icon: 'ph:user' },
      { name: 'email', label: 'Email', type: 'text', icon: 'ph:envelope' },
      { name: 'phone', label: 'Phone', type: 'text', icon: 'ph:phone' },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        icon: 'ph:flag',
        options: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']
      },
      {
        name: 'leadSource',
        label: 'Source',
        type: 'select',
        icon: 'ph:globe',
        options: ['EMAIL', 'WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'COLD_CALL', 'EVENT', 'OTHER']
      },
      { name: 'companyName', label: 'Company', type: 'text', icon: 'ph:buildings' },
      { name: 'score', label: 'Score', type: 'number', icon: 'ph:star' },
      { name: 'createdAt', label: 'Created At', type: 'date', icon: 'ph:calendar' }
    ]
  },
  deals: {
    key: 'deals',
    label: 'Deals',
    icon: 'ph:handshake',
    fields: [
      { name: 'name', label: 'Name', type: 'text', icon: 'ph:tag' },
      { name: 'price', label: 'Price', type: 'number', icon: 'ph:currency-dollar' },
      {
        name: 'stage',
        label: 'Stage',
        type: 'select',
        icon: 'ph:funnel',
        options: ['QUALIFYING', 'MEETING', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']
      },
      {
        name: 'contractType',
        label: 'Contract Type',
        type: 'select',
        icon: 'ph:file-text',
        options: ['SERVICE', 'PRODUCT', 'SUBSCRIPTION', 'MAINTENANCE']
      },
      { name: 'signatureDate', label: 'Signature Date', type: 'date', icon: 'ph:pen' },
      { name: 'createdAt', label: 'Created At', type: 'date', icon: 'ph:calendar' }
    ]
  },
  clients: {
    key: 'clients',
    label: 'Clients',
    icon: 'ph:address-book',
    fields: [
      { name: 'clientName', label: 'Client Name', type: 'text', icon: 'ph:user' },
      { name: 'email', label: 'Email', type: 'text', icon: 'ph:envelope' },
      { name: 'phoneNumber', label: 'Phone', type: 'text', icon: 'ph:phone' },
      { name: 'companyName', label: 'Company', type: 'text', icon: 'ph:buildings' },
      {
        name: 'industry',
        label: 'Industry',
        type: 'select',
        icon: 'ph:factory',
        options: ['TECHNOLOGY', 'HEALTHCARE', 'FINANCE', 'RETAIL', 'MANUFACTURING', 'EDUCATION', 'OTHER']
      },
      { name: 'clientStatus', label: 'Status', type: 'select', icon: 'ph:flag', options: ['ACTIVE', 'INACTIVE', 'PROSPECT'] },
      { name: 'createdAt', label: 'Created At', type: 'date', icon: 'ph:calendar' }
    ]
  },
  salesOrders: {
    key: 'salesOrders',
    label: 'Sales Orders',
    icon: 'ph:shopping-cart',
    fields: [
      { name: 'orderNumber', label: 'Order Number', type: 'text', icon: 'ph:hash' },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        icon: 'ph:flag',
        options: ['DRAFT', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
      },
      { name: 'total', label: 'Total Amount', type: 'number', icon: 'ph:currency-dollar' },
      { name: 'subtotal', label: 'Subtotal', type: 'number', icon: 'ph:currency-dollar' },
      { name: 'taxAmount', label: 'Tax Amount', type: 'number', icon: 'ph:receipt' },
      { name: 'currency', label: 'Currency', type: 'text', icon: 'ph:money' },
      { name: 'createdAt', label: 'Created At', type: 'date', icon: 'ph:calendar' }
    ]
  },
  invoices: {
    key: 'invoices',
    label: 'Invoices',
    icon: 'ph:invoice',
    fields: [
      { name: 'invoiceNumber', label: 'Invoice Number', type: 'text', icon: 'ph:hash' },
      { name: 'amount', label: 'Amount', type: 'number', icon: 'ph:currency-dollar' },
      { name: 'collected', label: 'Collected', type: 'select', icon: 'ph:check-circle', options: ['true', 'false'] },
      { name: 'invoiceDate', label: 'Invoice Date', type: 'date', icon: 'ph:calendar' },
      { name: 'collectedDate', label: 'Collected Date', type: 'date', icon: 'ph:calendar-check' },
      { name: 'createdAt', label: 'Created At', type: 'date', icon: 'ph:calendar' }
    ]
  },
  payments: {
    key: 'payments',
    label: 'Payments',
    icon: 'ph:credit-card',
    fields: [
      { name: 'paymentNumber', label: 'Payment Number', type: 'text', icon: 'ph:hash' },
      { name: 'amount', label: 'Amount', type: 'number', icon: 'ph:currency-dollar' },
      { name: 'method', label: 'Method', type: 'select', icon: 'ph:wallet', options: ['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'CHECK', 'ONLINE'] },
      { name: 'status', label: 'Status', type: 'select', icon: 'ph:flag', options: ['COMPLETED', 'PENDING', 'FAILED', 'VOIDED'] },
      { name: 'date', label: 'Date', type: 'date', icon: 'ph:calendar' },
      { name: 'reference', label: 'Reference', type: 'text', icon: 'ph:link' },
      { name: 'createdAt', label: 'Created At', type: 'date', icon: 'ph:calendar' }
    ]
  },
  tickets: {
    key: 'tickets',
    label: 'Tickets',
    icon: 'ph:ticket',
    fields: [
      { name: 'ticketNumber', label: 'Ticket Number', type: 'text', icon: 'ph:hash' },
      { name: 'subject', label: 'Subject', type: 'text', icon: 'ph:text-aa' },
      { name: 'priority', label: 'Priority', type: 'select', icon: 'ph:warning', options: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        icon: 'ph:flag',
        options: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED']
      },
      { name: 'source', label: 'Source', type: 'select', icon: 'ph:globe', options: ['EMAIL', 'PORTAL', 'PHONE', 'CHAT'] },
      { name: 'createdAt', label: 'Created At', type: 'date', icon: 'ph:calendar' }
    ]
  },
  employees: {
    key: 'employees',
    label: 'Employees',
    icon: 'ph:identification-badge',
    fields: [
      { name: 'employeeNumber', label: 'Employee Number', type: 'text', icon: 'ph:hash' },
      { name: 'firstName', label: 'First Name', type: 'text', icon: 'ph:user' },
      { name: 'lastName', label: 'Last Name', type: 'text', icon: 'ph:user' },
      { name: 'email', label: 'Email', type: 'text', icon: 'ph:envelope' },
      { name: 'jobTitle', label: 'Position', type: 'text', icon: 'ph:briefcase' },
      {
        name: 'employmentType',
        label: 'Employment Type',
        type: 'select',
        icon: 'ph:clock',
        options: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']
      },
      { name: 'status', label: 'Status', type: 'select', icon: 'ph:flag', options: ['ACTIVE', 'ON_LEAVE', 'TERMINATED', 'PROBATION'] },
      { name: 'salary', label: 'Salary', type: 'number', icon: 'ph:currency-dollar' },
      { name: 'hireDate', label: 'Hire Date', type: 'date', icon: 'ph:calendar' },
      { name: 'createdAt', label: 'Created At', type: 'date', icon: 'ph:calendar' }
    ]
  }
};

// ─── Filter Operators per Field Type ─────────────────────────

export const FILTER_OPERATORS_BY_TYPE: Record<string, { value: string; label: string }[]> = {
  text: [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'is_null', label: 'Is Empty' },
    { value: 'is_not_null', label: 'Is Not Empty' }
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'gte', label: 'Greater or Equal' },
    { value: 'lte', label: 'Less or Equal' },
    { value: 'between', label: 'Between' }
  ],
  date: [
    { value: 'equals', label: 'Equals' },
    { value: 'greater_than', label: 'After' },
    { value: 'less_than', label: 'Before' },
    { value: 'between', label: 'Between' },
    { value: 'is_null', label: 'Is Empty' },
    { value: 'is_not_null', label: 'Is Not Empty' }
  ],
  select: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'in', label: 'In' },
    { value: 'not_in', label: 'Not In' }
  ]
};

// ─── Chart Color Palettes ────────────────────────────────────

export const CHART_COLOR_SCHEMES: Record<string, string[]> = {
  purple: ['#7849ff', '#9b6dff', '#b794ff', '#d4bbff', '#ead9ff', '#6a3ae0', '#5a2dc7', '#4920ae'],
  blue: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'],
  green: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#059669', '#047857', '#065f46', '#064e3b'],
  orange: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#d97706', '#b45309', '#92400e', '#78350f'],
  mixed: ['#7849ff', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']
};

// ─── Composable ──────────────────────────────────────────────

export function useReportBuilderPro() {
  const config = ref<ReportBuilderProConfig>({
    modules: ['leads'],
    fields: ['name', 'email', 'status', 'createdAt'],
    filters: [],
    groupBy: '',
    aggregations: [],
    chartType: '',
    chartConfig: {
      xAxis: '',
      yAxis: '',
      colorScheme: 'purple',
      stacked: false,
      showLegend: true,
      showValues: false
    },
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    schedule: null
  });

  const results = ref<Record<string, unknown>[]>([]);
  const summary = ref<ReportSummary>({});
  const totalCount = ref(0);
  const loading = ref(false);
  const exporting = ref(false);
  const saving = ref(false);
  const savedReports = ref<Record<string, unknown>[]>([]);
  const filterLogic = ref<'AND' | 'OR'>('AND');

  // ─── Module fields ──────────────────────────────────────

  function getModuleFields(moduleKey: string): FieldDefinition[] {
    const mod = MODULE_DEFINITIONS[moduleKey];
    return mod ? mod.fields.map(f => ({ ...f, module: moduleKey })) : [];
  }

  function getActiveModuleFields(): FieldDefinition[] {
    const moduleKey = config.value.modules[0] as string | undefined;
    return moduleKey ? getModuleFields(moduleKey) : [];
  }

  function getFieldDefinition(fieldName: string): FieldDefinition | undefined {
    const moduleKey = config.value.modules[0] as string | undefined;
    if (!moduleKey) return undefined;
    const mod = MODULE_DEFINITIONS[moduleKey];
    return mod?.fields.find((f: FieldDefinition) => f.name === fieldName);
  }

  // ─── Report Execution ───────────────────────────────────

  async function buildReport(): Promise<void> {
    loading.value = true;
    try {
      const { body, success } = await useApiFetch('reports/builder/preview', 'POST', {
        modules: config.value.modules,
        fields: config.value.fields,
        filters: config.value.filters,
        groupBy: config.value.groupBy || undefined,
        aggregations: config.value.aggregations,
        sortBy: config.value.sortBy || undefined,
        sortOrder: config.value.sortOrder
      } as unknown);

      if (success && body) {
        results.value = body.data || [];
        totalCount.value = body.totalCount || 0;
        summary.value = body.summary || {};
      } else {
        results.value = [];
        totalCount.value = 0;
        summary.value = {};
      }
    } finally {
      loading.value = false;
    }
  }

  // ─── Export Functions ───────────────────────────────────

  function exportToCSV(data: Record<string, unknown>[], columns: string[], filename: string): void {
    if (!data.length) return;

    const headers = columns.length ? columns : Object.keys(data[0]);
    const rows = data.map(row =>
      headers
        .map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          const str = String(val);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  }

  function exportToExcel(data: Record<string, unknown>[], columns: string[], filename: string): void {
    if (!data.length) return;

    const headers = columns.length ? columns : Object.keys(data[0]);
    const worksheetData = [headers, ...data.map(row => headers.map(h => row[h] ?? ''))];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    ws['!cols'] = headers.map(() => ({ wch: 18 }));

    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadFile(blob, `${filename}.xlsx`);
  }

  async function exportToPDF(data: Record<string, unknown>[], columns: string[], filename: string): Promise<void> {
    if (!data.length) return;

    const { default: JsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new JsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait' });

    const headers = columns.length ? columns : Object.keys(data[0]);
    const tableData = data.map(row =>
      headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        return String(val);
      })
    );

    // Title
    doc.setFontSize(16);
    doc.setTextColor(120, 73, 255);
    doc.text('Report', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`Total Records: ${data.length}`, 14, 34);

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [120, 73, 255],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 243, 255]
      },
      theme: 'grid'
    });

    doc.save(`${filename}.pdf`);
  }

  function downloadFile(content: string | Blob, filename: string, mimeType?: string): void {
    let blob: Blob;
    if (content instanceof Blob) {
      blob = content;
    } else {
      blob = new Blob([content], { type: mimeType || 'application/octet-stream' });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Save / Load Reports ───────────────────────────────

  async function saveReport(name: string, description?: string): Promise<<unknown> {
    saving.value = true;
    try {
      const moduleKey = config.value.modules[0] as string | undefined;
      const entityTypeMap: Record<string, string> = {
        leads: 'LEAD',
        deals: 'DEAL',
        clients: 'CLIENT',
        salesOrders: 'SALES_ORDER',
        invoices: 'INVOICE',
        payments: 'PAYMENT',
        tickets: 'TICKET',
        employees: 'EMPLOYEE'
      };

      const payload = {
        name,
        description,
        entityType: (moduleKey ? entityTypeMap[moduleKey] : undefined) || moduleKey?.toUpperCase() || 'LEAD',
        fields: config.value.fields,
        filters: config.value.filters,
        groupBy: config.value.groupBy || null,
        aggregations: config.value.aggregations,
        sortBy: config.value.sortBy || null,
        sortOrder: config.value.sortOrder,
        chartType: config.value.chartType || null,
        chartConfig: config.value.chartConfig,
        schedule: config.value.schedule || null
      };

      const { body, success } = await useApiFetch('reports', 'POST', payload as unknown);
      if (success) return body;
      return null;
    } finally {
      saving.value = false;
    }
  }

  async function loadReport(id: number | string): Promise<void> {
    const { body, success } = await useApiFetch(`reports/${id}` as unknown);
    if (success && body) {
      const entityModuleMap: Record<string, string> = {
        LEAD: 'leads',
        DEAL: 'deals',
        CLIENT: 'clients',
        SALES_ORDER: 'salesOrders',
        INVOICE: 'invoices',
        PAYMENT: 'payments',
        TICKET: 'tickets',
        EMPLOYEE: 'employees'
      };

      config.value.modules = [entityModuleMap[body.entityType] || 'leads'];
      config.value.fields = body.fields || [];
      config.value.filters = body.filters || [];
      config.value.groupBy = body.groupBy || '';
      config.value.aggregations = body.aggregations || [];
      config.value.chartType = body.chartType || '';
      config.value.chartConfig = body.chartConfig || { colorScheme: 'purple', showLegend: true };
      config.value.sortBy = body.sortBy || 'createdAt';
      config.value.sortOrder = body.sortOrder || 'DESC';
      config.value.schedule = body.schedule || null;
    }
  }

  async function fetchSavedReports(): Promise<void> {
    const { body, success } = await useApiFetch('reports');
    if (success && Array.isArray(body)) {
      savedReports.value = body;
    }
  }

  async function deleteSavedReport(id: number | string): Promise<void> {
    await useApiFetch(`reports/${id}` as unknown, 'DELETE');
    savedReports.value = savedReports.value.filter(r => r.id !== id);
  }

  // ─── Schedule ───────────────────────────────────────────

  async function scheduleReport(reportId: number | string, schedule: ScheduleConfig): Promise<void> {
    await useApiFetch(`reports/${reportId}/schedule` as unknown, 'PUT', { schedule } as unknown);
  }

  // ─── Chart Options Generator ───────────────────────────

  function getChartOption(data: Record<string, unknown>[], chartType: string, chartConfig: ChartConfig) {
    if (!data.length || !chartType) return {};

    const colors = CHART_COLOR_SCHEMES[chartConfig.colorScheme || 'purple'];
    const xField = chartConfig.xAxis || config.value.groupBy;
    const yField = chartConfig.yAxis || 'count';

    if (!xField) return {};

    const labels = data.map((r) => r[xField] || 'N/A');
    const values = data.map((r) => Number(r[yField]) || 0);

    const baseLegend = chartConfig.showLegend !== false ? { show: true, bottom: 0, textStyle: { color: 'var(--text-muted)' } } : { show: false };

    const baseTooltip = { trigger: chartType === 'pie' || chartType === 'donut' ? 'item' : 'axis' };

    if (chartType === 'pie' || chartType === 'donut') {
      return {
        tooltip: baseTooltip,
        legend: baseLegend,
        color: colors,
        series: [
          {
            type: 'pie',
            radius: chartType === 'donut' ? ['40%', '65%'] : '60%',
            center: ['50%', '45%'],
            data: labels.map((l: string, i: number) => ({ name: l, value: values[i] })),
            emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.3)' } },
            label: {
              show: chartConfig.showValues !== false,
              formatter: '{b}: {c} ({d}%)',
              color: 'var(--text-secondary)'
            },
            itemStyle: { borderRadius: 6, borderColor: 'rgba(0,0,0,0.1)', borderWidth: 1 }
          }
        ]
      };
    }

    // Bar, Line, Area, Stacked
    const seriesType = chartType === 'area' ? 'line' : chartType === 'stacked' ? 'bar' : chartType;
    const series: unknown = {
      type: seriesType,
      data: values,
      itemStyle: { color: colors?.[0], borderRadius: chartType === 'bar' || chartType === 'stacked' ? [4, 4, 0, 0] : 0 },
      smooth: chartType === 'line' || chartType === 'area',
      areaStyle: chartType === 'area' ? { opacity: 0.3 } : undefined,
      stack: chartType === 'stacked' ? 'total' : undefined,
      label: chartConfig.showValues ? { show: true, position: 'top', color: 'var(--text-secondary)' } : undefined
    };

    return {
      tooltip: baseTooltip,
      legend: baseLegend,
      color: colors,
      grid: { left: '3%', right: '4%', bottom: chartConfig.showLegend !== false ? '15%' : '3%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { rotate: labels.length > 6 ? 30 : 0, color: 'var(--text-muted)' },
        axisLine: { lineStyle: { color: 'var(--border-default)' } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: 'var(--text-muted)' },
        splitLine: { lineStyle: { color: 'var(--border-default)', type: 'dashed' } }
      },
      series: [series]
    };
  }

  return {
    // State
    config,
    results,
    summary,
    totalCount,
    loading,
    exporting,
    saving,
    savedReports,
    filterLogic,

    // Module fields
    getModuleFields,
    getActiveModuleFields,
    getFieldDefinition,

    // Report execution
    buildReport,

    // Exports
    exportToCSV,
    exportToExcel,
    exportToPDF,

    // Save / Load
    saveReport,
    loadReport,
    fetchSavedReports,
    deleteSavedReport,

    // Schedule
    scheduleReport,

    // Chart
    getChartOption
  };
}
