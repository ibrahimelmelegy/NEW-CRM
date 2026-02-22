<template lang="pug">
.p-6.animate-entrance
  PremiumPageHeader(
    title="Document Hub"
    description="Central dashboard for all your business documents"
    icon="ph:files-bold"
    primaryColor="#7c3aed"
  )
    template(#actions)
      el-dropdown(trigger="click" @command="handleNewDocument")
        el-button(
          size="large"
          type="primary"
          class="!rounded-2xl"
        )
          Icon(name="ph:plus" size="16" class="mr-1")
          | New Document
          el-icon.ml-2: ArrowDown
        template(#dropdown)
          el-dropdown-menu
            el-dropdown-item(v-for="dt in documentTypes" :key="dt.type" :command="dt.type")
              .flex.items-center.gap-2
                Icon(:name="dt.icon" size="16")
                | {{ dt.label }}

  //- KPI Cards
  PremiumKPICards(:metrics="kpiMetrics")

  //- Charts Row
  .grid.grid-cols-1.lg_grid-cols-3.gap-4.mb-6
    //- Documents by Type (Donut)
    .glass-card.p-5.rounded-2xl
      h3.text-sm.font-bold.mb-4(style="color: var(--text-primary)") Documents by Type
      .flex.flex-wrap.gap-3.justify-center(v-if="stats")
        .flex.items-center.gap-2.px-3.py-2.rounded-xl(
          v-for="dt in documentTypes"
          :key="dt.type"
          style="background: var(--bg-surface)"
        )
          .w-3.h-3.rounded-full(:style="{ background: dt.color }")
          span.text-xs.font-semibold(style="color: var(--text-primary)") {{ dt.label }}
          span.text-xs.font-bold.ml-1(:style="{ color: dt.color }") {{ stats.byType?.[dt.type] || 0 }}
      .text-center.py-8(v-else)
        span.text-sm(style="color: var(--text-muted)") Loading...

    //- Documents by Status
    .glass-card.p-5.rounded-2xl
      h3.text-sm.font-bold.mb-4(style="color: var(--text-primary)") Documents by Status
      .space-y-3(v-if="stats")
        .flex.items-center.gap-3(v-for="s in statusBreakdown" :key="s.status")
          .flex-1
            .flex.justify-between.mb-1
              span.text-xs.font-medium(style="color: var(--text-secondary)") {{ s.label }}
              span.text-xs.font-bold(style="color: var(--text-primary)") {{ s.count }}
            el-progress(
              :percentage="stats.total > 0 ? Math.round((s.count / stats.total) * 100) : 0"
              :color="s.color"
              :stroke-width="6"
              :show-text="false"
            )
      .text-center.py-8(v-else)
        span.text-sm(style="color: var(--text-muted)") Loading...

    //- Total Value by Type
    .glass-card.p-5.rounded-2xl
      h3.text-sm.font-bold.mb-4(style="color: var(--text-primary)") Value by Type
      .space-y-3(v-if="stats")
        .flex.items-center.justify-between.px-3.py-2.rounded-xl(
          v-for="dt in documentTypes.filter(d => (stats?.valueByType?.[d.type] || 0) > 0)"
          :key="dt.type"
          style="background: var(--bg-surface)"
        )
          .flex.items-center.gap-2
            Icon(:name="dt.icon" size="16" :style="{ color: dt.color }")
            span.text-sm.font-medium(style="color: var(--text-primary)") {{ dt.label }}
          span.text-sm.font-bold(:style="{ color: dt.color }") {{ formatCurrency(stats.valueByType?.[dt.type] || 0) }}
        .text-center.py-4(v-if="!documentTypes.some(d => (stats?.valueByType?.[d.type] || 0) > 0)")
          span.text-sm(style="color: var(--text-muted)") No document values yet
      .text-center.py-8(v-else)
        span.text-sm(style="color: var(--text-muted)") Loading...

  //- Recent Documents
  .glass-card.rounded-2xl.overflow-hidden(v-loading="loading")
    .p-4.flex.items-center.justify-between.border-b(style="border-color: var(--glass-border-color)")
      h3.text-sm.font-bold(style="color: var(--text-primary)") Recent Documents
      .flex.items-center.gap-3
        el-select(
          v-model="typeFilter"
          placeholder="All Types"
          size="default"
          class="w-44"
          clearable
          @change="loadData"
        )
          el-option(label="All Types" value="")
          el-option(v-for="dt in documentTypes" :key="dt.type" :label="dt.label" :value="dt.type")
        el-input(
          v-model="searchKey"
          placeholder="Search..."
          size="default"
          clearable
          class="w-48"
          @keyup.enter="loadData"
          @clear="loadData"
        )
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="14")

    el-table(:data="documents" stripe style="width: 100%;")
      el-table-column(label="Type" width="150")
        template(#default="{ row }")
          .flex.items-center.gap-2
            Icon(:name="getTypeIcon(row.type)" size="16" :style="{ color: getTypeColor(row.type) }")
            span.text-sm.font-medium {{ formatType(row.type) }}
      el-table-column(prop="reference" label="Reference" width="150")
        template(#default="{ row }")
          span.font-mono.font-bold.text-sm {{ row.reference }}
      el-table-column(prop="title" label="Title" min-width="200")
        template(#default="{ row }")
          NuxtLink(:to="getDetailUrl(row)" class="font-bold hover:text-purple-600 transition-colors")
            | {{ row.title }}
      el-table-column(prop="clientName" label="Client" min-width="150")
        template(#default="{ row }")
          span {{ row.clientName || '—' }}
      el-table-column(prop="status" label="Status" width="150")
        template(#default="{ row }")
          el-tag(
            :type="statusTagType(row.status)"
            size="small"
            round
            effect="dark"
          ) {{ formatStatus(row.status) }}
      el-table-column(prop="total" label="Total" width="140" align="right")
        template(#default="{ row }")
          span.font-bold(v-if="row.total") {{ formatCurrency(Number(row.total)) }}
          span.text-gray-400(v-else) —
      el-table-column(prop="createdAt" label="Created" width="130")
        template(#default="{ row }")
          span.text-sm {{ formatDate(row.createdAt) }}
      el-table-column(label="" width="80" fixed="right")
        template(#default="{ row }")
          NuxtLink(:to="getDetailUrl(row)")
            el-button(size="small" circle plain)
              Icon(name="ph:arrow-right" size="14")

    //- Pagination
    .p-4.flex.justify-between.items-center.border-t(style="border-color: var(--glass-border-color)")
      span.text-sm(style="color: var(--text-muted)") {{ pagination.totalItems }} total documents
      el-pagination(
        v-model:current-page="currentPage"
        :page-size="15"
        :total="pagination.totalItems"
        layout="prev, pager, next"
        @current-change="handlePageChange"
      )

  //- Quick Actions
  .grid.grid-cols-2.sm_grid-cols-4.lg_grid-cols-5.gap-3.mt-6
    NuxtLink(
      v-for="dt in documentTypes"
      :key="dt.type"
      :to="dt.createPath"
      class="glass-card p-4 rounded-2xl flex flex-col items-center gap-2 hover:scale-[1.02] transition-transform cursor-pointer text-center"
    )
      .w-10.h-10.rounded-xl.flex.items-center.justify-center(:style="{ background: dt.color + '20' }")
        Icon(:name="dt.icon" size="20" :style="{ color: dt.color }")
      span.text-xs.font-semibold(style="color: var(--text-primary)") New {{ dt.label }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ArrowDown } from '@element-plus/icons-vue';
import { useDocBuilder } from '~/composables/useDocBuilder';
import type { KPIMetric } from '~/components/UI/PremiumKPICards.vue';

definePageMeta({ middleware: 'permissions' });

const { documents, loading, pagination, stats, fetchDocuments, getStats } = useDocBuilder();

const typeFilter = ref('');
const searchKey = ref('');
const currentPage = ref(1);

const documentTypes = [
  { type: 'quote', label: 'Quote', icon: 'ph:quotes-bold', color: '#3b82f6', createPath: '/sales/quotes/create', detailBase: '/sales/quotes' },
  { type: 'invoice', label: 'Invoice', icon: 'ph:receipt-bold', color: '#10b981', createPath: '/sales/invoices/create', detailBase: '/sales/invoices' },
  { type: 'proforma_invoice', label: 'Proforma Invoice', icon: 'ph:file-text-bold', color: '#8b5cf6', createPath: '/sales/proforma-invoices/create', detailBase: '/sales/proforma-invoices' },
  { type: 'purchase_order', label: 'Purchase Order', icon: 'ph:shopping-cart-bold', color: '#f59e0b', createPath: '/sales/purchase-orders/create', detailBase: '/sales/purchase-orders' },
  { type: 'contract', label: 'Contract', icon: 'ph:handshake-bold', color: '#6366f1', createPath: '/sales/contracts/create', detailBase: '/sales/contracts' },
  { type: 'sales_order', label: 'Sales Order', icon: 'ph:package-bold', color: '#0ea5e9', createPath: '/sales/sales-orders/create', detailBase: '/sales/sales-orders' },
  { type: 'delivery_note', label: 'Delivery Note', icon: 'ph:truck-bold', color: '#84cc16', createPath: '/sales/delivery-notes/create', detailBase: '/sales/delivery-notes' },
  { type: 'credit_note', label: 'Credit Note', icon: 'ph:note-bold', color: '#ef4444', createPath: '/sales/credit-notes/create', detailBase: '/sales/credit-notes' },
  { type: 'rfq', label: 'RFQ', icon: 'ph:clipboard-text-bold', color: '#14b8a6', createPath: '/sales/rfqs/create', detailBase: '/sales/rfqs' },
  { type: 'sla', label: 'SLA', icon: 'ph:shield-check-bold', color: '#a855f7', createPath: '/sales/slas/create', detailBase: '/sales/slas' }
];

// KPI Metrics
const kpiMetrics = computed<KPIMetric[]>(() => {
  const s = stats.value;
  return [
    { label: 'Total Documents', value: s?.total || 0, icon: 'ph:files-bold', color: '#7c3aed' },
    { label: 'Drafts', value: s?.byStatus?.DRAFT || 0, icon: 'ph:pencil-simple-bold', color: '#6b7280' },
    { label: 'Pending Approval', value: s?.byStatus?.PENDING_APPROVAL || 0, icon: 'ph:clock-bold', color: '#f59e0b' },
    { label: 'Total Value', value: formatCurrency(s?.totalValue || 0), icon: 'ph:currency-dollar-bold', color: '#10b981', isCurrency: true }
  ];
});

const statusBreakdown = computed(() => {
  const s = stats.value;
  if (!s) return [];
  return [
    { status: 'DRAFT', label: 'Draft', count: s.byStatus?.DRAFT || 0, color: '#6b7280' },
    { status: 'PENDING_APPROVAL', label: 'Pending', count: s.byStatus?.PENDING_APPROVAL || 0, color: '#f59e0b' },
    { status: 'APPROVED', label: 'Approved', count: s.byStatus?.APPROVED || 0, color: '#10b981' },
    { status: 'SENT', label: 'Sent', count: s.byStatus?.SENT || 0, color: '#3b82f6' },
    { status: 'PAID', label: 'Paid', count: s.byStatus?.PAID || 0, color: '#059669' },
    { status: 'REJECTED', label: 'Rejected', count: s.byStatus?.REJECTED || 0, color: '#ef4444' }
  ].filter(s => s.count > 0);
});

// Helpers
function getTypeIcon(type: string) {
  return documentTypes.find(d => d.type === type)?.icon || 'ph:file-text-bold';
}

function getTypeColor(type: string) {
  return documentTypes.find(d => d.type === type)?.color || '#7c3aed';
}

function formatType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
}

function formatStatus(status: string) {
  return (status || '').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
}

function statusTagType(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'info', PENDING_APPROVAL: 'warning', APPROVED: 'success',
    REJECTED: 'danger', SENT: '', PAID: 'success', CANCELLED: 'info', ARCHIVED: 'info'
  };
  return map[status] || '';
}

function formatDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!num && num !== 0) return '—';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' SAR';
}

function getDetailUrl(row: any) {
  const dt = documentTypes.find(d => d.type === row.type);
  return dt ? `${dt.detailBase}/${row.id}` : `/sales/documents/${row.id}`;
}

function handleNewDocument(type: string) {
  const dt = documentTypes.find(d => d.type === type);
  if (dt) navigateTo(dt.createPath);
}

function handlePageChange(page: number) {
  currentPage.value = page;
  loadData();
}

async function loadData() {
  const params: Record<string, any> = {
    page: currentPage.value,
    limit: 15,
    sort: 'DESC',
    sortBy: 'createdAt'
  };
  if (typeFilter.value) params.type = typeFilter.value;
  if (searchKey.value) params.searchKey = searchKey.value;
  await fetchDocuments(params);
  await getStats(typeFilter.value || undefined);
}

onMounted(() => loadData());
</script>
