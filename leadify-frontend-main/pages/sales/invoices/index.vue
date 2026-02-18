<template lang="pug">
div
  ModuleHeader(
    :title="$t('invoices.title')"
    :subtitle="$t('invoices.subtitle')"
  )
    template(#actions)
      ExportButton(:data="exportData" :columns="exportColumns" :filename="'invoices-export'" :title="$t('invoices.title')")

  StatCards(:stats="summaryStats")

  AppTable(
    v-slot="{data}"
    :externalLoading="loading"
    :filterOptions="filterOptions"
    :columns="table.columns"
    position="invoices"
    :pageInfo="pagination"
    :data="table.data"
    @handleRowClick="handleRowClick"
    :searchPlaceholder="$t('invoices.title')"
    :key="table.data"
  )
    .flex.items-center.py-2(@click.stop)
      el-dropdown(class="outline-0" trigger="click")
        span(class="el-dropdown-link")
          .toggle-icon.text-md
            Icon(name="IconToggle" size="22")
        template(#dropdown)
          el-dropdown-menu
            el-dropdown-item(v-if="!data?.collected" @click="handleCollect(data?.id)")
              .flex.items-center
                Icon.text-md.mr-2(name="ph:check-circle-bold")
                p.text-sm {{ $t('invoices.markCollected') }}
            el-dropdown-item(v-else @click="handleUncollect(data?.id)")
              .flex.items-center
                Icon.text-md.mr-2(name="ph:arrow-counter-clockwise-bold")
                p.text-sm {{ $t('invoices.undo') }}
            el-dropdown-item(@click="exportInvoicePDF(data)")
              .flex.items-center
                Icon.text-md.mr-2(name="ph:file-pdf-bold")
                p.text-sm PDF

  //- Template Selector
  el-dialog(v-model="showTemplateSelector" :title="$t('invoices.selectTemplate') || 'Select Invoice Template'" width="500px")
    .space-y-3
      .glass-card.p-3.rounded-xl.cursor-pointer.flex.items-center.justify-between(
        v-for="tpl in invoiceTemplates"
        :key="tpl.id"
        @click="downloadInvoiceWithTemplate(tpl)"
      )
        .flex.items-center.gap-3
          Icon(name="ph:file-pdf-bold" size="24" class="text-purple-400")
          div
            .font-bold(style="color: var(--text-primary)") {{ tpl.name }}
            .text-xs(style="color: var(--text-muted)") {{ tpl.layout?.elements?.length || 0 }} elements
        Icon(name="ph:arrow-right" size="18" style="color: var(--text-muted)")
    template(#footer)
      el-button(@click="showTemplateSelector = false") {{ $t('common.cancel') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import type { InvoiceItem, InvoiceSummary } from '~/composables/useInvoices';
import { fetchInvoices, fetchInvoiceSummary, markCollected, markUncollected } from '~/composables/useInvoices';

definePageMeta({ middleware: 'permissions' });
const { $i18n } = useNuxtApp();
const t = $i18n.t;
const router = useRouter();

// Export columns & data
const exportColumns = [
  { prop: 'invoiceNumber', label: t('invoices.invoiceNo') },
  { prop: 'dealDetails', label: t('invoices.deal') },
  { prop: 'formattedAmount', label: t('invoices.amount') },
  { prop: 'formattedDate', label: t('invoices.date') },
  { prop: 'statusLabel', label: t('invoices.status') },
  { prop: 'formattedCollectedDate', label: t('invoices.collectedDate') }
];
const exportData = computed(() => table.value.data);

const loading = ref(true);
const collecting = ref<number | null>(null);

// Data
const invoices = ref<InvoiceItem[]>([]);
const summary = ref<InvoiceSummary>({ totalInvoices: 0, totalAmount: 0, collectedAmount: 0, pendingAmount: 0, collectedCount: 0, pendingCount: 0 });
const pagination = ref({ page: 1, limit: 20, totalItems: 0, totalPages: 0 });

const summaryStats = computed(() => [
  { label: t('invoices.totalInvoices'), value: summary.value.totalInvoices, icon: 'ph:file-text-bold', color: '#7849ff' },
  { label: t('invoices.totalAmount'), value: formatCurrency(summary.value.totalAmount), icon: 'ph:money-bold', color: '#3b82f6' },
  { label: t('invoices.collected'), value: formatCurrency(summary.value.collectedAmount), icon: 'ph:check-circle-bold', color: '#22c55e' },
  { label: t('invoices.pending'), value: formatCurrency(summary.value.pendingAmount), icon: 'ph:clock-bold', color: '#f59e0b' }
]);

const table = ref({
  columns: [] as any[],
  data: [] as any[],
  sort: []
});

const updateColumns = () => {
  table.value.columns = [
    { prop: 'invoiceNumber', label: t('invoices.invoiceNo'), component: 'Text', sortable: true, type: 'font-bold', width: 150 },
    { prop: 'dealDetails', label: t('invoices.deal'), component: 'AvatarText', type: 'font-bold', width: 200 },
    { prop: 'formattedAmount', label: t('invoices.amount'), component: 'Text', sortable: true, type: 'font-bold', width: 140 },
    { prop: 'formattedDate', label: t('invoices.date'), component: 'Text', sortable: true, type: 'font-default', width: 130 },
    {
      prop: 'statusLabel',
      label: t('invoices.status') || t('finance.expenses.status'),
      component: 'Label',
      type: 'outline',
      filters: [
        { text: t('invoices.collected'), value: 'COLLECTED' },
        { text: t('invoices.pending'), value: 'PENDING' }
      ],
      width: 140
    },
    { prop: 'formattedCollectedDate', label: t('invoices.collectedDate'), component: 'Text', type: 'font-default', width: 140 }
  ];
};
updateColumns();

const filterOptions = computed(() => [
  {
    title: t('invoices.status') || 'Status',
    value: 'status',
    options: [
      { label: t('invoices.collected'), value: 'collected' },
      { label: t('invoices.pending'), value: 'pending' }
    ]
  }
]);

onMounted(async () => {
  await Promise.all([loadInvoices(), loadSummary()]);
});

async function loadInvoices() {
  loading.value = true;
  try {
    const result = await fetchInvoices({ page: 1, limit: 20 });
    invoices.value = result.docs;
    pagination.value = result.pagination;
    table.value.data = result.docs.map(formatRow);
  } finally {
    loading.value = false;
  }
}

async function loadSummary() {
  summary.value = await fetchInvoiceSummary();
}

function formatRow(inv: InvoiceItem) {
  return {
    ...inv,
    dealDetails: { title: inv.deal?.name || `Deal #${inv.dealId}`, text: '' },
    formattedAmount: formatCurrency(inv.amount),
    formattedDate: inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '—',
    statusLabel: inv.collected ? 'COLLECTED' : 'PENDING',
    formattedCollectedDate: inv.collectedDate ? new Date(inv.collectedDate).toLocaleDateString() : '—'
  };
}

function handleRowClick(row: any) {
  // Navigate to deal detail for now
  if (row.dealId) router.push(`/sales/deals/${row.dealId}`);
}

async function handleCollect(id: number) {
  collecting.value = id;
  try {
    await markCollected(id);
    await Promise.all([loadInvoices(), loadSummary()]);
    ElNotification({ type: 'success', title: t('common.success'), message: t('invoices.markCollected') });
  } finally { collecting.value = null; }
}

async function handleUncollect(id: number) {
  collecting.value = id;
  try {
    await markUncollected(id);
    await Promise.all([loadInvoices(), loadSummary()]);
    ElNotification({ type: 'info', title: t('common.success'), message: t('invoices.pending') });
  } finally { collecting.value = null; }
}

function handleExport() {
  const csvHeaders = ['Invoice #', 'Deal', 'Amount', 'Date', 'Status', 'Collected Date'];
  const rows = (table.value.data || []).map((r: any) => [
    r.invoiceNumber, r.dealDetails?.title, r.formattedAmount, r.formattedDate, r.statusLabel, r.formattedCollectedDate
  ]);
  const csv = [csvHeaders, ...rows].map(r => r.map((v: any) => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'invoices.csv';
  link.click();
  URL.revokeObjectURL(url);
}

// Template-based PDF export
const showTemplateSelector = ref(false);
const invoiceTemplates = ref<any[]>([]);
const selectedInvoice = ref<any>(null);

async function exportInvoicePDF(row: any) {
  const { fetchDocumentTemplates } = await import('~/composables/useDocumentTemplates');
  const result = await fetchDocumentTemplates({ type: 'INVOICE', limit: '50' });
  if (result.docs.length > 0) {
    invoiceTemplates.value = result.docs;
    selectedInvoice.value = row;
    showTemplateSelector.value = true;
  } else {
    ElNotification({ type: 'info', title: 'No Templates', message: 'Create invoice templates in Settings > Document Templates' });
  }
}

async function downloadInvoiceWithTemplate(template: any) {
  showTemplateSelector.value = false;
  const { generatePDF } = await import('~/utils/pdfExporter');
  const inv = selectedInvoice.value;
  const data = {
    companyName: 'LEADIFY ERP', companyAddress: '', companyPhone: '', companyEmail: '',
    invoiceNumber: inv.invoiceNumber,
    date: inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '',
    dueDate: '', clientName: inv.deal?.name || '', clientAddress: '',
    subtotal: formatCurrency(inv.amount), tax: formatCurrency(0), total: formatCurrency(inv.amount),
    notes: '',
    items: [{ description: inv.deal?.name || 'Invoice', qty: 1, rate: inv.amount, unitprice: inv.amount, amount: inv.amount, total: inv.amount }]
  };
  generatePDF(template.layout, data, `Invoice-${inv.invoiceNumber}.pdf`);
  ElNotification({ type: 'success', title: t('common.success'), message: 'PDF downloaded' });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount || 0);
}
</script>
