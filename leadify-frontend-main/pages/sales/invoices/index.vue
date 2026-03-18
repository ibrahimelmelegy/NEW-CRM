<template lang="pug">
div
  ModuleHeader(
    :title="$t('invoices.title')"
    :subtitle="$t('invoices.subtitle')"
  )
    template(#actions)
      ExportButton(:data="exportData" :columns="exportColumns" :filename="'invoices-export'" :title="$t('invoices.title')")

  //- Skeleton Loading State
  SkeletonTable(v-if="loading" :rows="6" :cols="6")

  StatCards(v-if="!loading" :stats="summaryStats")

  //- Analytics Section
  .grid.gap-4.mb-6(v-if="!loading" class="grid-cols-2 md:grid-cols-4")
    .glass-card.p-5.rounded-2xl(v-for="stat in analyticsStats" :key="stat.label")
      .flex.items-center.justify-between
        div
          p.text-xs.font-medium.uppercase.tracking-wide(style="color: var(--text-muted)") {{ stat.label }}
          p.text-2xl.font-bold.mt-1(:style="{ color: stat.color }") {{ stat.value }}
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(:style="{ background: stat.color + '20' }")
          Icon(:name="stat.icon" size="20" :style="{ color: stat.color }")

  //- Aging Report Card
  .glass-card.p-6.rounded-2xl.mb-6(v-if="agingReport && !loading")
    .flex.items-center.gap-2.mb-4
      .w-8.h-8.rounded-xl.flex.items-center.justify-center(style="background: rgba(120,73,255,0.15)")
        Icon(name="ph:clock-countdown-bold" size="16" style="color: #7849ff")
      h3.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('invoices.agingReport') }}
      .ml-auto
        span.text-xs(style="color: var(--text-muted)") {{ $t('invoices.totalOutstanding') }}:
        span.text-sm.font-bold.ml-1(style="color: #ef4444") {{ formatCurrency(agingReport.totalOutstanding || 0) }}
    .grid.gap-3(class="grid-cols-2 md:grid-cols-4")
      .rounded-xl.p-4.text-center(v-for="bucket in agingBuckets" :key="bucket.label" :style="{ background: bucket.bg, border: `1px solid ${bucket.borderColor}` }")
        p.text-xs.font-medium.mb-1(:style="{ color: bucket.color }") {{ bucket.label }}
        p.text-lg.font-bold(:style="{ color: bucket.color }") {{ formatCurrency(bucket.amount) }}
        p.text-xs.mt-1(style="color: var(--text-muted)") {{ bucket.count }} {{ $t('invoices.title').toLowerCase() }}

  SavedViews(v-if="!loading" :entityType="'invoice'" :currentFilters="{}" @apply-view="handleApplyView")
  AdvancedSearch(v-if="!loading" :entityType="'invoice'" :fields="advancedSearchFields" @apply="handleAdvancedFilter" @clear="handleClearAdvancedFilter")

  //- Desktop Table
  .inv-desktop-view(v-if="!loading")
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
      emptyIcon="ph:file-text-bold"
      :emptyMessage="$t('invoices.emptyMessage')"
      :emptyDescription="$t('invoices.emptyDescription')"
      emptyActionHref="/sales/invoices/create"
      :emptyActionLabel="$t('invoices.createInvoice')"
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
              el-dropdown-item(@click="deleteId = data?.id; deletePopup = true")
                .flex.items-center
                  Icon.text-md.mr-2(name="ph:trash-bold")
                  p.text-sm {{ $t('common.delete') }}

  //- Mobile Card View
  .inv-mobile-view(v-if="!loading")
    PullToRefresh(:loading="mobileRefreshing" @refresh="handleMobileRefresh")
      .mb-3
        el-input(v-model="mobileSearch" size="large" :placeholder="`${$t('common.search')} ${$t('invoices.title')}`" clearable class="!rounded-xl")
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")

      .status-pills.flex.gap-2.mb-4.overflow-x-auto.pb-2.-mx-1.px-1
        button.status-pill(
          v-for="filter in mobileInvFilters"
          :key="filter.value"
          :class="{ 'status-pill--active': mobileInvStatus === filter.value }"
          :style="mobileInvStatus === filter.value ? { background: filter.color, borderColor: filter.color } : {}"
          @click="mobileInvStatus = filter.value; vibrate()"
        )
          span {{ filter.label }}
          span.status-pill__count(v-if="filter.count > 0") {{ filter.count }}

      .space-y-3(v-if="mobileFilteredInvoices.length")
        SwipeCard(
          v-for="inv in mobileFilteredInvoices"
          :key="inv.id"
          :rightActions="[{ name: inv.collected ? 'uncollect' : 'collect', label: inv.collected ? $t('invoices.undo') : $t('invoices.markCollected'), icon: inv.collected ? 'ph:arrow-counter-clockwise-bold' : 'ph:check-circle-bold', color: inv.collected ? '#f59e0b' : '#10B981' }]"
          :leftActions="[{ name: 'pdf', label: 'PDF', icon: 'ph:file-pdf-bold', color: '#EF4444' }, { name: 'delete', label: $t('common.delete'), icon: 'ph:trash-bold', color: '#dc2626' }]"
          @action="(name) => handleInvSwipe(name, inv)"
        )
          .entity-card.p-4(@click="handleRowClick(inv)")
            .flex.items-start.justify-between.mb-3
              .flex.items-center.gap-3.min-w-0.flex-1
                .w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0.text-sm.font-bold(
                  :style="{ background: inv.collected ? '#10b98120' : '#f59e0b20', color: inv.collected ? '#10b981' : '#f59e0b' }"
                )
                  Icon(:name="inv.collected ? 'ph:check-circle' : 'ph:clock'" size="18")
                .min-w-0.flex-1
                  p.text-sm.font-bold.truncate(style="color: var(--text-primary)") {{ inv.invoiceNumber || '--' }}
                  p.text-xs.truncate(style="color: var(--text-muted)") {{ inv.dealDetails?.title || '' }}
              el-tag.shrink-0(:type="inv.collected ? 'success' : 'warning'" size="small" effect="dark" round) {{ inv.statusLabel }}

            .grid.grid-cols-2.gap-2
              .flex.items-center.gap-2
                Icon(name="ph:money" size="14" style="color: var(--text-muted)")
                span.text-xs.font-semibold.truncate(style="color: var(--text-secondary)") {{ inv.formattedAmount }}
              .flex.items-center.gap-2(v-if="inv.formattedDate")
                Icon(name="ph:calendar" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ inv.formattedDate }}

      .text-center.py-12(v-if="!mobileFilteredInvoices.length")
        Icon(name="ph:receipt" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

      .text-center.mt-4.pb-20(v-if="mobileFilteredInvoices.length")
        span.text-xs(style="color: var(--text-muted)") {{ mobileFilteredInvoices.length }} {{ $t('invoices.title').toLowerCase() }}

  //- Template Selector
  el-dialog(v-model="showTemplateSelector" :title="$t('invoices.selectTemplate')" width="500px")
    .space-y-3
      //- Server-side standard PDF option
      .glass-card.p-3.rounded-xl.cursor-pointer.flex.items-center.justify-between(
        @click="downloadServerPdf(selectedInvoice)"
        style="border: 1px solid rgba(120,73,255,0.3)"
      )
        .flex.items-center.gap-3
          Icon(name="ph:file-pdf-bold" size="24" style="color: #7849ff")
          div
            .font-bold(style="color: var(--text-primary)") {{ $t('invoices.standardPdf') }}
            .text-xs(style="color: var(--text-muted)") {{ $t('invoices.standardPdfDesc') }}
        Icon(name="ph:arrow-right" size="18" style="color: var(--text-muted)")
      //- Custom templates
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

  ActionModel(v-model="deletePopup" :loading="deleting" :description="$t('common.confirmDelete')" @confirm="confirmDelete")
</template>

<script setup lang="ts">
import { ElMessage, ElNotification } from 'element-plus';
import type { InvoiceItem, InvoiceSummary } from '~/composables/useInvoices';
import { fetchInvoices, fetchInvoiceSummary, markCollected, markUncollected, downloadInvoicePdf, deleteInvoiceById } from '~/composables/useInvoices';
import { getAgingReport } from '~/composables/useInvoiceBilling';
import type { AgingReport } from '~/composables/useInvoiceBilling';

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
const deletePopup = ref(false);
const deleteId = ref<number | null>(null);
const deleting = ref(false);

// Data
const invoices = ref<InvoiceItem[]>([]);
const summary = ref<InvoiceSummary>({ totalInvoices: 0, totalAmount: 0, collectedAmount: 0, pendingAmount: 0, collectedCount: 0, pendingCount: 0 });
const pagination = ref({ page: 1, limit: 20, totalItems: 0, totalPages: 0 });

// Aging report data
const agingReport = ref<AgingReport | null>(null);

const analyticsStats = computed(() => {
  const s = summary.value;
  const overdueCount = (table.value.data || []).filter(r => {
    if (r.statusLabel === 'COLLECTED') return false;
    if (!r.invoiceDate) return false;
    const dueDate = new Date(r.invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);
    return new Date() > dueDate;
  }).length;
  return [
    { label: t('invoices.totalRevenue'), value: formatCurrency(s.totalAmount), icon: 'ph:chart-line-up-bold', color: '#7849ff' },
    { label: t('invoices.collected'), value: formatCurrency(s.collectedAmount), icon: 'ph:check-circle-bold', color: '#22c55e' },
    { label: t('invoices.outstanding'), value: formatCurrency(s.pendingAmount), icon: 'ph:warning-circle-bold', color: '#f59e0b' },
    { label: t('invoices.overdueCount'), value: overdueCount, icon: 'ph:alarm-bold', color: '#ef4444' }
  ];
});

const agingBuckets = computed(() => {
  if (!agingReport.value?.buckets) return [];
  const b = agingReport.value.buckets;
  return [
    {
      label: t('invoices.agingCurrent'),
      amount: b.current?.amount || 0,
      count: b.current?.count || 0,
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.08)',
      borderColor: 'rgba(34,197,94,0.2)'
    },
    {
      label: t('invoices.aging30Days'),
      amount: b.thirtyDays?.amount || 0,
      count: b.thirtyDays?.count || 0,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.08)',
      borderColor: 'rgba(245,158,11,0.2)'
    },
    {
      label: t('invoices.aging60Days'),
      amount: b.sixtyDays?.amount || 0,
      count: b.sixtyDays?.count || 0,
      color: '#f97316',
      bg: 'rgba(249,115,22,0.08)',
      borderColor: 'rgba(249,115,22,0.2)'
    },
    {
      label: t('invoices.aging90Plus'),
      amount: b.ninetyPlus?.amount || 0,
      count: b.ninetyPlus?.count || 0,
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.08)',
      borderColor: 'rgba(239,68,68,0.2)'
    }
  ];
});

const summaryStats = computed(() => [
  { label: t('invoices.totalInvoices'), value: summary.value.totalInvoices, icon: 'ph:file-text-bold', color: '#7849ff' },
  { label: t('invoices.totalAmount'), value: formatCurrency(summary.value.totalAmount), icon: 'ph:money-bold', color: '#3b82f6' },
  { label: t('invoices.collected'), value: formatCurrency(summary.value.collectedAmount), icon: 'ph:check-circle-bold', color: '#22c55e' },
  { label: t('invoices.pending'), value: formatCurrency(summary.value.pendingAmount), icon: 'ph:clock-bold', color: '#f59e0b' }
]);

const table = ref({
  columns: [] as unknown[],
  data: [] as unknown[],
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
      label: t('invoices.status'),
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
    title: t('invoices.status'),
    value: 'status',
    options: [
      { label: t('invoices.collected'), value: 'collected' },
      { label: t('invoices.pending'), value: 'pending' }
    ]
  }
]);

onMounted(async () => {
  await Promise.all([loadInvoices(), loadSummary(), loadAgingReport()]);
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

async function loadAgingReport() {
  try {
    const report = await getAgingReport();
    if (report) agingReport.value = report;
  } catch {
    // Aging report is non-critical
  }
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

function handleRowClick(row: unknown) {
  // Navigate to deal detail for now
  if (row.dealId) router.push(`/sales/deals/${row.dealId}`);
}

async function handleCollect(id: number) {
  collecting.value = id;
  try {
    await markCollected(id);
    await Promise.all([loadInvoices(), loadSummary()]);
    ElNotification({ type: 'success', title: t('common.success'), message: t('invoices.markCollected') });
  } finally {
    collecting.value = null;
  }
}

async function handleUncollect(id: number) {
  collecting.value = id;
  try {
    await markUncollected(id);
    await Promise.all([loadInvoices(), loadSummary()]);
    ElNotification({ type: 'info', title: t('common.success'), message: t('invoices.pending') });
  } finally {
    collecting.value = null;
  }
}

async function confirmDelete() {
  if (!deleteId.value) return;
  deleting.value = true;
  try {
    const response = await deleteInvoiceById(deleteId.value);
    if (response?.success) {
      await Promise.all([loadInvoices(), loadSummary()]);
    }
  } finally {
    deleting.value = false;
    deletePopup.value = false;
    deleteId.value = null;
  }
}

function handleExport() {
  const csvHeaders = ['Invoice #', 'Deal', 'Amount', 'Date', 'Status', 'Collected Date'];
  const rows = (table.value.data || []).map(r => [
    r.invoiceNumber,
    r.dealDetails?.title,
    r.formattedAmount,
    r.formattedDate,
    r.statusLabel,
    r.formattedCollectedDate
  ]);
  const csv = [csvHeaders, ...rows].map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'invoices.csv';
  link.click();
  URL.revokeObjectURL(url);
}

// Template-based PDF export
const showTemplateSelector = ref(false);
const invoiceTemplates = ref<Record<string, unknown>[]>([]);
const selectedInvoice = ref<Record<string, unknown> | null>(null);

async function exportInvoicePDF(row: unknown) {
  const { fetchDocumentTemplates } = await import('~/composables/useDocumentTemplates');
  const result = await fetchDocumentTemplates({ type: 'INVOICE', limit: '50' });
  invoiceTemplates.value = result.docs || [];
  selectedInvoice.value = row;
  showTemplateSelector.value = true;
}

async function downloadServerPdf(inv: unknown) {
  showTemplateSelector.value = false;
  const success = await downloadInvoicePdf(inv.id, inv.invoiceNumber);
  if (success) {
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.pdfDownloaded') });
  } else {
    ElNotification({ type: 'error', title: t('common.error'), message: t('invoices.pdfFailed') });
  }
}

async function downloadInvoiceWithTemplate(template: unknown) {
  showTemplateSelector.value = false;
  const { generatePDF } = await import('~/utils/pdfExporter');
  const inv = selectedInvoice.value;
  const data = {
    companyName: 'HIGH POINT TECHNOLOGY',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    invoiceNumber: inv.invoiceNumber,
    date: inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '',
    dueDate: '',
    clientName: inv.deal?.name || '',
    clientAddress: '',
    subtotal: formatCurrency(inv.amount),
    tax: formatCurrency(0),
    total: formatCurrency(inv.amount),
    notes: '',
    items: [{ description: inv.deal?.name || 'Invoice', qty: 1, rate: inv.amount, unitprice: inv.amount, amount: inv.amount, total: inv.amount }]
  };
  generatePDF(template.layout, data, `Invoice-${inv.invoiceNumber}.pdf`);
  ElNotification({ type: 'success', title: t('common.success'), message: t('common.pdfDownloaded') });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount || 0);
}

// SavedViews & AdvancedSearch
const advancedSearchFields = [
  { key: 'invoiceNumber', label: t('invoices.table.invoiceNumber'), type: 'string' },
  { key: 'amount', label: t('invoices.table.amount'), type: 'number' },
  {
    key: 'status',
    label: t('invoices.table.status'),
    type: 'select',
    options: [
      { value: 'collected', label: t('invoices.collected') },
      { value: 'pending', label: t('invoices.pending') }
    ]
  },
  { key: 'invoiceDate', label: t('invoices.table.date'), type: 'date' }
];

async function handleApplyView(view: unknown) {
  if (view?.filters) {
    try {
      const qs = '?' + new URLSearchParams(view.filters).toString();
      const res = await useApiFetch(`invoice${qs}`);
      if (res?.success && res?.body) {
        const data = res.body as unknown;
        table.value.data = data.docs || [];
      }
    } catch (e: unknown) {
      ElMessage.error(t('common.error'));
    }
  }
}

async function handleAdvancedFilter(filterPayload: unknown) {
  try {
    const res = await useApiFetch('search/advanced/invoice', 'POST', filterPayload);
    if (res?.success && res?.body) {
      const data = res.body as unknown;
      table.value.data = data.docs || data || [];
    }
  } catch (e: unknown) {
    ElMessage.error(t('common.error'));
  }
}

async function handleClearAdvancedFilter() {
  await loadInvoices();
}

// Mobile
const { vibrate } = useMobile();
const mobileSearch = ref('');
const mobileInvStatus = ref('ALL');
const mobileRefreshing = ref(false);

const mobileInvFilters = computed(() => {
  const data = table.value.data || [];
  return [
    { value: 'ALL', label: t('common.all'), color: '#7849ff', count: data.length },
    { value: 'COLLECTED', label: t('invoices.collected'), color: '#22c55e', count: data.filter(i => i.statusLabel === 'COLLECTED').length },
    { value: 'PENDING', label: t('invoices.pending'), color: '#f59e0b', count: data.filter(i => i.statusLabel === 'PENDING').length }
  ];
});

const mobileFilteredInvoices = computed(() => {
  let data = table.value.data || [];
  if (mobileInvStatus.value !== 'ALL') data = data.filter(i => i.statusLabel === mobileInvStatus.value);
  if (!mobileSearch.value) return data;
  const q = mobileSearch.value.toLowerCase();
  return data.filter(i => {
    const num = (i.invoiceNumber || '').toLowerCase();
    const deal = (i.dealDetails?.title || '').toLowerCase();
    return num.includes(q) || deal.includes(q);
  });
});

async function handleMobileRefresh() {
  mobileRefreshing.value = true;
  try {
    await Promise.all([loadInvoices(), loadSummary()]);
    vibrate([10, 30, 10]);
  } finally {
    mobileRefreshing.value = false;
  }
}

function handleInvSwipe(name: string, inv: unknown) {
  vibrate();
  switch (name) {
    case 'collect':
      handleCollect(inv.id);
      break;
    case 'uncollect':
      handleUncollect(inv.id);
      break;
    case 'pdf':
      exportInvoicePDF(inv);
      break;
    case 'delete':
      deleteId.value = inv.id;
      deletePopup.value = true;
      break;
  }
}
</script>

<style lang="scss" scoped>
@include mobile-list-page('inv', #7849ff);
</style>
