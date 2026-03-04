<template lang="pug">
.p-6.animate-entrance
  PremiumPageHeader(
    :title="pageTitle"
    :description="pageDescription"
    :icon="pageIcon"
    :primaryColor="pageColor"
  )
    template(#actions)
      NuxtLink(:to="createUrl")
        el-button(
          size="large"
          type="primary"
          :icon="Plus"
          class="!rounded-2xl"
        ) New {{ singularTitle }}

  //- KPI Cards
  PremiumKPICards(:metrics="kpiMetrics")

  //- Filters
  .glass-card.p-4.rounded-2xl.mb-4
    .flex.items-center.gap-4.flex-wrap
      el-input(
        v-model="searchKey"
        :placeholder="`Search ${pageTitle.toLowerCase()}...`"
        size="large"
        class="!rounded-xl max-w-xs"
        clearable
        @clear="handleSearch"
        @keyup.enter="handleSearch"
      )
        template(#prefix)
          Icon(name="ph:magnifying-glass" size="18")
      el-select(
        v-model="statusFilter"
        :placeholder="$t('common.allStatuses')"
        size="large"
        class="w-48"
        clearable
        @change="handleSearch"
      )
        el-option(:label="$t('common.all')" value="")
        el-option(v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value")
      el-date-picker(
        v-model="dateRange"
        type="daterange"
        :start-placeholder="$t('common.from')"
        :end-placeholder="$t('common.to')"
        size="large"
        class="!rounded-xl"
        @change="handleSearch"
        clearable
      )
      .ml-auto
        el-button(size="large" class="!rounded-xl" @click="handleSearch")
          Icon(name="ph:arrows-clockwise" size="16" class="mr-1")
          | Refresh

  //- Desktop Table
  .doc-desktop-view
    .glass-card.rounded-2xl.overflow-hidden(v-loading="loading")
      el-table(
        :data="documents"
        stripe
        style="width: 100%;"
        @sort-change="handleSort"
        :default-sort="{ prop: 'createdAt', order: 'descending' }"
      )
        el-table-column(prop="reference" :label="$t('finance.reference')" width="160" sortable="custom")
          template(#default="{ row }")
            span.font-mono.font-bold.text-sm {{ row.reference }}
        el-table-column(prop="title" :label="$t('common.title')" min-width="200" sortable="custom")
          template(#default="{ row }")
            NuxtLink(:to="`${detailBaseUrl}/${row.id}`" class="font-bold hover:text-purple-600 transition-colors")
              | {{ row.title }}
        el-table-column(prop="clientName" :label="$t('customerSuccess.client')" min-width="160")
          template(#default="{ row }")
            .flex.flex-col
              span.font-medium {{ row.clientName || '—' }}
              span.text-xs.text-gray-400(v-if="row.clientCompany") {{ row.clientCompany }}
        el-table-column(prop="status" :label="$t('common.status')" width="150" sortable="custom")
          template(#default="{ row }")
            el-dropdown(trigger="click" @command="(cmd: string) => handleStatusChange(row, cmd)")
              el-tag(
                :type="statusTagType(row.status)"
                size="small"
                round
                effect="dark"
                class="cursor-pointer"
              ) {{ formatStatus(row.status) }}
              template(#dropdown)
                el-dropdown-menu
                  el-dropdown-item(
                    v-for="s in getNextStatuses(row.status)"
                    :key="s"
                    :command="s"
                  ) {{ formatStatus(s) }}
        el-table-column(prop="total" :label="$t('common.total')" width="150" sortable="custom" align="right")
          template(#default="{ row }")
            span.font-bold(v-if="row.total") {{ Number(row.total).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
            span.text-gray-400(v-else) —
            span.text-xs.text-gray-400.ml-1(v-if="row.total") {{ row.currency || 'SAR' }}
        el-table-column(prop="createdAt" :label="$t('support.created')" width="140" sortable="custom")
          template(#default="{ row }")
            span.text-sm {{ formatDate(row.createdAt) }}
        el-table-column(:label="$t('common.actions')" width="160" fixed="right")
          template(#default="{ row }")
            .flex.gap-1
              el-tooltip(content="View / Edit" placement="top")
                NuxtLink(:to="`${detailBaseUrl}/${row.id}`")
                  el-button(size="small" circle plain)
                    Icon(name="ph:pencil-simple" size="14")
              el-tooltip(content="Duplicate" placement="top")
                el-button(size="small" circle plain @click="handleDuplicate(row)")
                  Icon(name="ph:copy" size="14")
              el-tooltip(content="Export PDF" placement="top")
                el-button(size="small" circle plain @click="handleExportPdf(row)")
                  Icon(name="ph:file-pdf" size="14")
              el-tooltip(content="Send" placement="top")
                el-button(size="small" circle plain @click="openSendDialog(row)")
                  Icon(name="ph:paper-plane-tilt" size="14")
              el-tooltip(content="Delete" placement="top")
                el-button(size="small" circle type="danger" plain @click="handleDelete(row)")
                  Icon(name="ph:trash" size="14")

      //- Pagination
      .p-4.flex.justify-between.items-center.border-t(style="border-color: var(--glass-border-color)")
        span.text-sm(style="color: var(--text-muted)") Showing {{ documents.length }} of {{ pagination.totalItems }} documents
        el-pagination(
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.totalItems"
          layout="sizes, prev, pager, next"
          @current-change="handlePageChange"
          @size-change="handlePageSizeChange"
        )

  //- Mobile Card View
  .doc-mobile-view
    PullToRefresh(:loading="mobileRefreshing" @refresh="handleMobileRefresh")
      //- Mobile Search
      .mb-3
        el-input(
          v-model="mobileSearch"
          size="large"
          :placeholder="`Search ${pageTitle.toLowerCase()}...`"
          clearable
          class="!rounded-xl"
        )
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")

      //- Status Filter Pills
      .doc-status-pills.flex.gap-2.mb-4.overflow-x-auto.pb-2.-mx-1.px-1
        button.doc-pill(
          v-for="filter in mobileStatusFilters"
          :key="filter.value"
          :class="{ 'doc-pill--active': mobileStatusFilter === filter.value }"
          :style="mobileStatusFilter === filter.value ? { background: filter.color, borderColor: filter.color } : {}"
          @click="mobileStatusFilter = filter.value; vibrate()"
        )
          span {{ filter.label }}

      //- Document Cards
      .space-y-3(v-if="mobileFilteredDocs.length")
        SwipeCard(
          v-for="doc in mobileFilteredDocs"
          :key="doc.id"
          :rightActions="[{ name: 'pdf', label: 'PDF', icon: 'ph:file-pdf-bold', color: '#EF4444' }]"
          :leftActions="[{ name: 'view', label: 'View', icon: 'ph:eye-bold', color: pageColor }, { name: 'send', label: 'Send', icon: 'ph:paper-plane-tilt-bold', color: '#3B82F6' }]"
          @action="(name) => handleMobileSwipe(name, doc)"
        )
          .doc-card.p-4(@click="navigateTo(`${detailBaseUrl}/${doc.id}`)")
            .flex.items-start.justify-between.mb-3
              .flex.items-center.gap-3.min-w-0.flex-1
                .doc-avatar.w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0(
                  :style="{ background: pageColor + '20', color: pageColor }"
                )
                  Icon(:name="pageIcon" size="18")
                .min-w-0.flex-1
                  p.text-sm.font-bold.truncate(style="color: var(--text-primary)") {{ doc.title || doc.reference || '—' }}
                  p.text-xs.font-mono.truncate(style="color: var(--text-muted)") {{ doc.reference }}
              el-tag.shrink-0(
                :type="statusTagType(doc.status)"
                size="small"
                effect="dark"
                round
              ) {{ formatStatus(doc.status) }}

            .grid.grid-cols-2.gap-2
              .flex.items-center.gap-2(v-if="doc.clientName")
                Icon(name="ph:user" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ doc.clientName }}
              .flex.items-center.gap-2(v-if="doc.total")
                Icon(name="ph:money" size="14" style="color: var(--text-muted)")
                span.text-xs.font-semibold.truncate(style="color: var(--text-secondary)") {{ Number(doc.total).toLocaleString('en-US', { minimumFractionDigits: 2 }) }} {{ doc.currency || 'SAR' }}
              .flex.items-center.gap-2(v-if="doc.createdAt")
                Icon(name="ph:calendar" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ formatDate(doc.createdAt) }}

      //- Empty state
      .text-center.py-12(v-if="!mobileFilteredDocs.length")
        Icon(:name="pageIcon" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") No {{ pageTitle.toLowerCase() }} found

      //- Result count
      .text-center.mt-4.pb-20(v-if="mobileFilteredDocs.length")
        span.text-xs(style="color: var(--text-muted)") {{ mobileFilteredDocs.length }} {{ pageTitle.toLowerCase() }}

    //- FAB
    .doc-mobile-fab(@click="navigateTo(createUrl)")
      Icon(name="ph:plus-bold" size="24")

  //- Send Dialog
  SendDocumentDialog(
    v-model="showSendDialog"
    :documentId="sendRow?.id || ''"
    :clientEmail="sendRow?.clientEmail"
    :documentReference="sendRow?.reference"
    :documentTitle="sendRow?.title"
    :documentType="documentType"
    @sent="loadData"
  )

  //- Empty State (only when not loading and no docs)
  .glass-card.p-12.mt-4.flex.flex-col.items-center.justify-center.text-center.min-h-72(v-if="!loading && documents.length === 0 && !searchKey && !statusFilter")
    Icon(:name="pageIcon" size="64" class="text-purple-300 mb-4 opacity-50")
    h3.text-2xl.font-bold(style="color: var(--text-primary)") No {{ pageTitle }} Yet
    p.text-muted.mt-2.max-w-md Create your first {{ singularTitle.toLowerCase() }} using the Document Builder.
    NuxtLink(:to="createUrl").mt-6
      el-button(type="primary" size="large" class="!rounded-xl") Create {{ singularTitle }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { useDocBuilder } from '~/composables/useDocBuilder';
import type { KPIMetric } from '~/components/UI/PremiumKPICards.vue';

const props = withDefaults(
  defineProps<{
    documentType: string;
    title?: string;
    subtitle?: string;
    icon?: string;
    color?: string;
  }>(),
  {
    icon: 'ph:file-text-bold',
    color: '#7c3aed'
  }
);

const { documents, loading, pagination, stats, fetchDocuments, deleteDocument, changeStatus, getStats, createDocument, generatePdf } =
  useDocBuilder();

// Page config
const typeConfig: Record<string, { title: string; singular: string; icon: string; color: string; createPath: string; detailPath: string }> = {
  quote: {
    title: 'Quotes',
    singular: 'Quote',
    icon: 'ph:quotes-bold',
    color: '#3b82f6',
    createPath: '/sales/quotes/create',
    detailPath: '/sales/quotes'
  },
  invoice: {
    title: 'Invoices',
    singular: 'Invoice',
    icon: 'ph:receipt-bold',
    color: '#10b981',
    createPath: '/sales/invoices/create',
    detailPath: '/sales/invoices'
  },
  proforma_invoice: {
    title: 'Proforma Invoices',
    singular: 'Proforma Invoice',
    icon: 'ph:file-text-bold',
    color: '#8b5cf6',
    createPath: '/sales/proforma-invoices/create',
    detailPath: '/sales/proforma-invoices'
  },
  purchase_order: {
    title: 'Purchase Orders',
    singular: 'Purchase Order',
    icon: 'ph:shopping-cart-bold',
    color: '#f59e0b',
    createPath: '/sales/purchase-orders/create',
    detailPath: '/sales/purchase-orders'
  },
  credit_note: {
    title: 'Credit Notes',
    singular: 'Credit Note',
    icon: 'ph:note-bold',
    color: '#ef4444',
    createPath: '/sales/credit-notes/create',
    detailPath: '/sales/credit-notes'
  },
  contract: {
    title: 'Contracts',
    singular: 'Contract',
    icon: 'ph:handshake-bold',
    color: '#6366f1',
    createPath: '/sales/contracts/create',
    detailPath: '/sales/contracts'
  },
  rfq: {
    title: 'RFQs',
    singular: 'RFQ',
    icon: 'ph:clipboard-text-bold',
    color: '#14b8a6',
    createPath: '/sales/rfqs/create',
    detailPath: '/sales/rfqs'
  },
  sales_order: {
    title: 'Sales Orders',
    singular: 'Sales Order',
    icon: 'ph:package-bold',
    color: '#0ea5e9',
    createPath: '/sales/sales-orders/create',
    detailPath: '/sales/sales-orders'
  },
  delivery_note: {
    title: 'Delivery Notes',
    singular: 'Delivery Note',
    icon: 'ph:truck-bold',
    color: '#84cc16',
    createPath: '/sales/delivery-notes/create',
    detailPath: '/sales/delivery-notes'
  },
  sla: { title: 'SLAs', singular: 'SLA', icon: 'ph:shield-check-bold', color: '#a855f7', createPath: '/sales/slas/create', detailPath: '/sales/slas' }
};

const config = computed(
  () =>
    typeConfig[props.documentType] || {
      title: 'Documents',
      singular: 'Document',
      icon: 'ph:file-text-bold',
      color: '#7c3aed',
      createPath: '#',
      detailPath: '#'
    }
);
const pageTitle = computed(() => props.title || config.value.title);
const singularTitle = computed(() => config.value.singular);
const pageDescription = computed(() => props.subtitle || `Manage and track your ${config.value.title.toLowerCase()}`);
const pageIcon = computed(() => (props.icon !== 'ph:file-text-bold' ? props.icon : config.value.icon));
const pageColor = computed(() => (props.color !== '#7c3aed' ? props.color : config.value.color));
const createUrl = computed(() => config.value.createPath);
const detailBaseUrl = computed(() => config.value.detailPath);

// Send dialog
const showSendDialog = ref(false);
const sendRow = ref<any>(null);

function openSendDialog(row: any) {
  sendRow.value = row;
  showSendDialog.value = true;
}

// Filters
const searchKey = ref('');
const statusFilter = ref('');
const dateRange = ref<[Date, Date] | null>(null);
const currentPage = ref(1);
const pageSize = ref(20);
const sortBy = ref('createdAt');
const sortOrder = ref('DESC');

const statusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Sent', value: 'SENT' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Archived', value: 'ARCHIVED' }
];

// KPI Metrics
const kpiMetrics = computed<KPIMetric[]>(() => {
  const s = stats.value;
  if (!s)
    return [
      { label: `Total ${pageTitle.value}`, value: 0, icon: config.value.icon, color: config.value.color },
      { label: 'Draft', value: 0, icon: 'ph:pencil-simple-bold', color: '#6b7280' },
      { label: 'Pending', value: 0, icon: 'ph:clock-bold', color: '#f59e0b' },
      { label: 'Approved', value: 0, icon: 'ph:check-circle-bold', color: '#10b981' }
    ];

  return [
    { label: `Total ${pageTitle.value}`, value: s.total, icon: config.value.icon, color: config.value.color },
    { label: 'Draft', value: s.byStatus?.DRAFT || 0, icon: 'ph:pencil-simple-bold', color: '#6b7280' },
    { label: 'Pending', value: s.byStatus?.PENDING_APPROVAL || 0, icon: 'ph:clock-bold', color: '#f59e0b' },
    { label: 'Approved', value: s.byStatus?.APPROVED || 0, icon: 'ph:check-circle-bold', color: '#10b981' }
  ];
});

// Status helpers
function statusTagType(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'info',
    PENDING_APPROVAL: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    SENT: '',
    PAID: 'success',
    CANCELLED: 'info',
    ARCHIVED: 'info'
  };
  return map[status] || '';
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getNextStatuses(current: string): string[] {
  const flow: Record<string, string[]> = {
    DRAFT: ['PENDING_APPROVAL', 'CANCELLED'],
    PENDING_APPROVAL: ['APPROVED', 'REJECTED'],
    APPROVED: ['SENT', 'CANCELLED'],
    REJECTED: ['DRAFT'],
    SENT: ['PAID', 'CANCELLED'],
    PAID: ['ARCHIVED'],
    CANCELLED: ['DRAFT'],
    ARCHIVED: ['DRAFT']
  };
  return flow[current] || [];
}

function formatDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Data fetching
async function loadData() {
  const params: Record<string, any> = {
    type: props.documentType,
    page: currentPage.value,
    limit: pageSize.value,
    sortBy: sortBy.value,
    sort: sortOrder.value
  };
  if (searchKey.value) params.searchKey = searchKey.value;
  if (statusFilter.value) params.status = statusFilter.value;
  if (dateRange.value) {
    params.fromDate = dateRange.value[0].toISOString();
    params.toDate = dateRange.value[1].toISOString();
  }
  await fetchDocuments(params);
  await getStats(props.documentType);
}

function handleSearch() {
  currentPage.value = 1;
  loadData();
}

function handlePageChange(page: number) {
  currentPage.value = page;
  loadData();
}

function handlePageSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
  loadData();
}

function handleSort({ prop, order }: { prop: string; order: string }) {
  sortBy.value = prop;
  sortOrder.value = order === 'ascending' ? 'ASC' : 'DESC';
  loadData();
}

async function handleStatusChange(row: any, newStatus: string) {
  try {
    let reason: string | undefined;
    if (newStatus === 'REJECTED') {
      const result = await ElMessageBox.prompt('Enter rejection reason:', 'Reject Document', {
        inputPlaceholder: 'Reason for rejection...',
        confirmButtonText: 'Reject',
        cancelButtonText: 'Cancel'
      });
      reason = (result as any).value;
    }
    const response = await changeStatus(row.id, newStatus, reason);
    if (response?.success) {
      ElMessage.success(`Status changed to ${formatStatus(newStatus)}`);
      loadData();
    } else {
      ElMessage.error(response?.message || 'Failed to change status');
    }
  } catch {
    /* cancelled */
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`Delete "${row.title}"? This will archive the document.`, 'Delete', { type: 'warning' });
    const response = await deleteDocument(row.id);
    if (response?.success) {
      ElMessage.success('Document archived');
      loadData();
    } else {
      ElMessage.error(response?.message || 'Failed to delete');
    }
  } catch {
    /* cancelled */
  }
}

async function handleDuplicate(row: any) {
  try {
    await ElMessageBox.confirm(`Duplicate "${row.title}"?`, 'Duplicate Document', { confirmButtonText: 'Duplicate' });
    const response = await createDocument({
      type: row.type,
      title: `${row.title} (Copy)`,
      content: row.content,
      clientName: row.clientName,
      clientCompany: row.clientCompany,
      clientEmail: row.clientEmail,
      currency: row.currency,
      notes: row.notes
    } as any);
    if (response?.success) {
      ElMessage.success('Document duplicated');
      loadData();
    }
  } catch {
    /* cancelled */
  }
}

async function handleExportPdf(row: any) {
  try {
    ElMessage.info('Generating PDF...');
    const response: any = await generatePdf(row.id);
    if (response?.success && response.body?.pdfUrl) {
      const baseUrl = useRuntimeConfig().public.apiBase || '';
      window.open(`${baseUrl}${response.body.pdfUrl}`, '_blank');
      ElMessage.success('PDF generated');
    } else {
      // Fallback: navigate to detail page
      navigateTo(`${detailBaseUrl.value}/${row.id}`);
    }
  } catch {
    navigateTo(`${detailBaseUrl.value}/${row.id}`);
  }
}

onMounted(() => loadData());

watch(
  () => props.documentType,
  () => {
    currentPage.value = 1;
    loadData();
  }
);

// Mobile
const { vibrate } = useMobile();
const mobileSearch = ref('');
const mobileStatusFilter = ref('ALL');
const mobileRefreshing = ref(false);

const mobileStatusFilters = [
  { value: 'ALL', label: 'All', color: '#7c3aed' },
  { value: 'DRAFT', label: 'Draft', color: '#6b7280' },
  { value: 'PENDING_APPROVAL', label: 'Pending', color: '#f59e0b' },
  { value: 'APPROVED', label: 'Approved', color: '#10b981' },
  { value: 'SENT', label: 'Sent', color: '#3b82f6' },
  { value: 'PAID', label: 'Paid', color: '#22c55e' }
];

const mobileFilteredDocs = computed(() => {
  let data = documents.value || [];
  if (mobileStatusFilter.value !== 'ALL') {
    data = data.filter((d: any) => d.status === mobileStatusFilter.value);
  }
  if (!mobileSearch.value) return data;
  const q = mobileSearch.value.toLowerCase();
  return data.filter((d: any) => {
    const title = (d.title || '').toLowerCase();
    const ref = (d.reference || '').toLowerCase();
    const client = (d.clientName || '').toLowerCase();
    return title.includes(q) || ref.includes(q) || client.includes(q);
  });
});

async function handleMobileRefresh() {
  mobileRefreshing.value = true;
  try {
    await loadData();
    vibrate([10, 30, 10]);
  } finally {
    mobileRefreshing.value = false;
  }
}

function handleMobileSwipe(name: string, doc: any) {
  vibrate();
  switch (name) {
    case 'view':
      navigateTo(`${detailBaseUrl.value}/${doc.id}`);
      break;
    case 'pdf':
      handleExportPdf(doc);
      break;
    case 'send':
      openSendDialog(doc);
      break;
  }
}
</script>

<style lang="scss" scoped>
.doc-mobile-view {
  display: none;
}

@media (max-width: 767px) {
  .doc-mobile-view {
    display: block;
  }
  .doc-desktop-view {
    display: none;
  }

  .doc-card {
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    background: var(--glass-bg, rgba(255, 255, 255, 0.06));
    border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
    border-radius: 16px;
    &:active {
      opacity: 0.85;
    }
  }
}

.doc-status-pills {
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.doc-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 100px;
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.15));
  background: var(--glass-bg, rgba(255, 255, 255, 0.06));
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  min-height: 36px;
  &:active {
    transform: scale(0.95);
  }
  &--active {
    color: #fff;
    border-color: transparent;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  }
}

.doc-mobile-fab {
  display: none;
}

@media (max-width: 767px) {
  .doc-mobile-fab {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    bottom: calc(80px + env(safe-area-inset-bottom, 0px) + 16px);
    right: 20px;
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    color: #fff;
    box-shadow: 0 6px 24px rgba(124, 58, 237, 0.4);
    cursor: pointer;
    z-index: 40;
    transition: all 0.2s ease;
    -webkit-tap-highlight-color: transparent;
    &:active {
      transform: scale(0.9);
      box-shadow: 0 3px 12px rgba(124, 58, 237, 0.3);
    }
  }
}
</style>
