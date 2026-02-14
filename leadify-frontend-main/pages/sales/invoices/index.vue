<template lang="pug">
.invoices-page.p-8
  .flex.justify-between.items-start.mb-8
    div
      h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('invoices.title') }}
      p(style="color: var(--text-muted)") {{ $t('invoices.subtitle') }}

  //- Summary Cards
  .grid.grid-cols-1.gap-4.mb-8(class="md:grid-cols-4")
    .glass-card.p-5
      p.text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('invoices.totalInvoices') }}
      p.text-2xl.font-bold(style="color: var(--text-primary)") {{ summary.totalInvoices }}
    .glass-card.p-5
      p.text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('invoices.totalAmount') }}
      p.text-2xl.font-bold(style="color: #7849ff") {{ formatCurrency(summary.totalAmount) }}
    .glass-card.p-5
      p.text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('invoices.collected') }}
      p.text-2xl.font-bold.text-green-500 {{ formatCurrency(summary.collectedAmount) }}
    .glass-card.p-5
      p.text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('invoices.pending') }}
      p.text-2xl.font-bold.text-orange-500 {{ formatCurrency(summary.pendingAmount) }}

  //- Filters
  .flex.gap-4.mb-6
    el-input(v-model="search" :placeholder="$t('invoices.searchInvoice')" clearable class="w-64" @input="debounceLoad")
      template(#prefix)
        Icon(name="ph:magnifying-glass" size="16" aria-hidden="true")
    el-select(v-model="statusFilter" clearable :placeholder="$t('invoices.allStatuses')" @change="loadInvoices" class="w-44")
      el-option(value="collected" :label="$t('invoices.collected')")
      el-option(value="pending" :label="$t('invoices.pending')")

  //- Table
  .glass-card.p-6
    el-table(:data="invoices" style="width: 100%" v-loading="loading")
      el-table-column(:label="$t('invoices.invoiceNo')" prop="invoiceNumber" width="160")
      el-table-column(:label="$t('invoices.deal')" min-width="200")
        template(#default="{ row }")
          NuxtLink.text-purple-500(:to="`/sales/deals/show/${row.dealId}`" style="text-decoration: none") {{ row.deal?.name || row.dealId }}
      el-table-column(:label="$t('invoices.amount')" width="140" align="right")
        template(#default="{ row }")
          span.font-bold {{ formatCurrency(row.amount) }}
      el-table-column(:label="$t('invoices.date')" width="130")
        template(#default="{ row }")
          span {{ row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString() : '—' }}
      el-table-column(:label="$t('invoices.status')" width="130" align="center")
        template(#default="{ row }")
          el-tag(:type="row.collected ? 'success' : 'warning'" effect="dark" size="small") {{ row.collected ? $t('invoices.collected') : $t('invoices.pending') }}
      el-table-column(:label="$t('invoices.collectedDate')" width="140")
        template(#default="{ row }")
          span {{ row.collectedDate ? new Date(row.collectedDate).toLocaleDateString() : '—' }}
      el-table-column(:label="$t('common.actions')" width="120" align="center")
        template(#default="{ row }")
          el-button(
            v-if="!row.collected"
            type="success"
            size="small"
            @click="handleCollect(row.id)"
            :loading="collecting === row.id"
            class="!rounded-lg"
          ) {{ $t('invoices.markCollected') }}
          el-button(
            v-else
            type="warning"
            size="small"
            plain
            @click="handleUncollect(row.id)"
            :loading="collecting === row.id"
            class="!rounded-lg"
          ) {{ $t('invoices.undo') }}

    .flex.justify-center.mt-4(v-if="pagination.totalPages > 1")
      el-pagination(
        v-model:current-page="currentPage"
        :page-size="pagination.limit"
        :total="pagination.totalItems"
        layout="prev, pager, next"
        @current-change="loadInvoices"
      )
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import type { InvoiceItem, InvoiceSummary } from '~/composables/useInvoices';
import { fetchInvoices, fetchInvoiceSummary, markCollected, markUncollected } from '~/composables/useInvoices';

definePageMeta({ title: 'Invoices' });

const invoices = ref<InvoiceItem[]>([]);
const summary = ref<InvoiceSummary>({ totalInvoices: 0, totalAmount: 0, collectedAmount: 0, pendingAmount: 0, collectedCount: 0, pendingCount: 0 });
const loading = ref(true);
const collecting = ref<number | null>(null);
const search = ref('');
const statusFilter = ref('');
const currentPage = ref(1);
const pagination = ref({ page: 1, limit: 20, totalItems: 0, totalPages: 0 });

let debounceTimer: ReturnType<typeof setTimeout>;

onMounted(async () => {
  await Promise.all([loadInvoices(), loadSummary()]);
});

async function loadInvoices() {
  loading.value = true;
  try {
    const result = await fetchInvoices({
      page: currentPage.value,
      limit: 20,
      status: statusFilter.value || undefined,
      search: search.value || undefined
    });
    invoices.value = result.docs;
    pagination.value = result.pagination;
  } finally {
    loading.value = false;
  }
}

async function loadSummary() {
  summary.value = await fetchInvoiceSummary();
}

function debounceLoad() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1;
    loadInvoices();
  }, 400);
}

async function handleCollect(id: number) {
  collecting.value = id;
  try {
    await markCollected(id);
    await Promise.all([loadInvoices(), loadSummary()]);
    ElNotification({ type: 'success', title: 'Collected', message: 'Invoice marked as collected' });
  } finally {
    collecting.value = null;
  }
}

async function handleUncollect(id: number) {
  collecting.value = id;
  try {
    await markUncollected(id);
    await Promise.all([loadInvoices(), loadSummary()]);
    ElNotification({ type: 'info', title: 'Updated', message: 'Invoice marked as pending' });
  } finally {
    collecting.value = null;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount);
}
</script>

<style lang="scss" scoped>
.invoices-page {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
