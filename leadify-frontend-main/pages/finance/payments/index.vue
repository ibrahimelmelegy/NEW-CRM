<template lang="pug">
div
  ModuleHeader(
    :title="$t('payments.title')"
    :subtitle="$t('payments.subtitle')"
  )
    template(#actions)
      el-button(type="primary" size="large" @click="$router.push('/finance/payments/record')")
        Icon(name="ph:plus-bold" size="18")
        span.mx-1 {{ $t('payments.recordPayment') }}
      el-button(size="large" @click="$router.push('/finance/payments/collection-dashboard')" class="premium-btn-secondary")
        Icon(name="ph:chart-pie-bold" size="18")
        span.mx-1 {{ $t('payments.collectionDashboard') }}

  //- Status filter tabs
  .glass-card.mb-6.p-4
    el-radio-group(v-model="activeStatus" size="large" @change="handleStatusChange")
      el-radio-button(value="ALL") {{ $t('common.all') }}
      el-radio-button(value="COMPLETED")
        el-badge(:value="statusCounts.completed" :max="999" type="success" class="ml-1")
          span {{ $t('payments.statusCompleted') }}
      el-radio-button(value="PENDING")
        el-badge(:value="statusCounts.pending" :max="999" type="warning" class="ml-1")
          span {{ $t('payments.statusPending') }}
      el-radio-button(value="VOIDED")
        el-badge(:value="statusCounts.voided" :max="999" type="info" class="ml-1")
          span {{ $t('payments.statusVoided') }}

  //- Payments table
  .glass-card
    .p-4.border-b.flex.items-center.justify-between(style="border-color: var(--border-color)")
      el-input(
        v-model="searchKey"
        :placeholder="$t('payments.searchPayments')"
        clearable
        size="large"
        style="max-width: 320px"
        @input="debouncedSearch"
      )
        template(#prefix)
          Icon(name="ph:magnifying-glass" size="18")
      .flex.items-center.gap-3
        el-select(v-model="filterMethod" clearable :placeholder="$t('payments.paymentMethod')" size="large" style="width: 180px" @change="fetchData")
          el-option(v-for="opt in paymentMethodOptions" :key="opt.value" :label="opt.label" :value="opt.value")
        el-date-picker(
          v-model="dateRange"
          type="daterange"
          :range-separator="$t('common.to')"
          :start-placeholder="$t('common.startDate')"
          :end-placeholder="$t('common.endDate')"
          value-format="YYYY-MM-DD"
          size="large"
          @change="fetchData"
        )

    el-table(
      :data="payments"
      v-loading="loading"
      style="width: 100%"
      @row-click="handleRowClick"
      row-class-name="cursor-pointer"
      stripe
    )
      el-table-column(prop="paymentNumber" :label="$t('payments.paymentNumber')" width="150" sortable)
        template(#default="{ row }")
          span.font-semibold {{ row.paymentNumber }}
      el-table-column(prop="client" :label="$t('common.client')" min-width="180")
        template(#default="{ row }")
          span {{ row.client?.clientName || '-' }}
      el-table-column(prop="amount" :label="$t('payments.amount')" width="140" sortable)
        template(#default="{ row }")
          span.font-bold {{ formatCurrency(row.amount) }}
      el-table-column(prop="date" :label="$t('payments.date')" width="130" sortable)
        template(#default="{ row }")
          span {{ formatDate(row.date) }}
      el-table-column(prop="method" :label="$t('payments.method')" width="150")
        template(#default="{ row }")
          el-tag(size="small" :type="''" effect="plain") {{ methodLabel(row.method) }}
      el-table-column(prop="status" :label="$t('common.status')" width="130")
        template(#default="{ row }")
          el-tag(size="small" :type="statusType(row.status)" effect="light") {{ statusLabel(row.status) }}
      el-table-column(prop="reference" :label="$t('payments.reference')" width="160")
        template(#default="{ row }")
          span {{ row.reference || '-' }}
      el-table-column(label="" width="60" align="center")
        template(#default="{ row }")
          el-dropdown(trigger="click" @click.stop)
            el-button(text circle)
              Icon(name="ph:dots-three-vertical-bold" size="18")
            template(#dropdown)
              el-dropdown-menu
                el-dropdown-item(@click="$router.push(`/finance/payments/${row.id}`)")
                  .flex.items-center.gap-2
                    Icon(name="ph:eye-bold" size="16")
                    span {{ $t('common.viewDetails') }}
                el-dropdown-item(
                  v-if="row.status === 'COMPLETED'"
                  @click="handleVoid(row.id)"
                )
                  .flex.items-center.gap-2
                    Icon(name="ph:prohibit-bold" size="16")
                    span {{ $t('payments.voidPayment') }}

    //- Pagination
    .flex.items-center.justify-between.p-4(v-if="pagination.totalPages > 1")
      span.text-sm(style="color: var(--text-muted)") {{ $t('payments.showingOf', { count: payments.length, total: pagination.totalItems }) }}
      el-pagination(
        v-model:current-page="currentPage"
        :page-size="pagination.limit"
        :total="pagination.totalItems"
        layout="prev, pager, next"
        @current-change="handlePageChange"
      )

  ActionModel(v-model="voidPopup" :loading="voiding" :description="$t('payments.confirmVoidMessage')" @confirm="confirmVoid")
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import {
  getPayments,
  voidPayment,
  paymentMethodOptions,
  paymentStatusColors,
  paymentMethodLabels,
  type PaymentItem
} from '~/composables/usePayments';

definePageMeta({ middleware: 'permissions' });
const router = useRouter();
const { t, locale } = useI18n();

const loading = ref(false);
const payments = ref<PaymentItem[]>([]);
const pagination = ref({ page: 1, limit: 10, totalItems: 0, totalPages: 0 });
const currentPage = ref(1);
const activeStatus = ref('ALL');
const searchKey = ref('');
const filterMethod = ref('');
const dateRange = ref<[string, string] | null>(null);
const voidPopup = ref(false);
const voiding = ref(false);
const voidTargetId = ref<string | null>(null);

const statusCounts = ref({ completed: 0, pending: 0, voided: 0 });

let searchTimeout: ReturnType<typeof setTimeout>;
function debouncedSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => fetchData(), 400);
}

async function fetchData() {
  loading.value = true;
  try {
    const result = await getPayments({
      page: currentPage.value,
      limit: 10,
      status: activeStatus.value === 'ALL' ? undefined : activeStatus.value,
      searchKey: searchKey.value || undefined,
      method: filterMethod.value || undefined,
      startDate: dateRange.value?.[0] || undefined,
      endDate: dateRange.value?.[1] || undefined
    });
    payments.value = result.docs;
    pagination.value = result.pagination;
  } finally {
    loading.value = false;
  }
}

function handleStatusChange() {
  currentPage.value = 1;
  fetchData();
}

function handlePageChange(page: number) {
  currentPage.value = page;
  fetchData();
}

function handleRowClick(row: PaymentItem) {
  router.push(`/finance/payments/${row.id}`);
}

function handleVoid(id: string) {
  voidTargetId.value = id;
  voidPopup.value = true;
}

async function confirmVoid() {
  if (!voidTargetId.value) return;
  voiding.value = true;
  try {
    const res = await voidPayment(voidTargetId.value);
    if (res.success) {
      await fetchData();
    }
  } finally {
    voiding.value = false;
    voidPopup.value = false;
    voidTargetId.value = null;
  }
}

function statusType(status: string): string {
  return paymentStatusColors[status] || '';
}

const paymentStatusI18nKeys: Record<string, string> = {
  COMPLETED: 'payments.statusCompleted',
  PENDING: 'payments.statusPending',
  FAILED: 'payments.statusFailed',
  VOIDED: 'payments.statusVoided'
};

function statusLabel(status: string): string {
  const key = paymentStatusI18nKeys[status];
  return key ? t(key) : status;
}

function methodLabel(method: string): string {
  return paymentMethodLabels[method] || method;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'SAR', minimumFractionDigits: 2 }).format(amount || 0);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString(locale.value, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Initial load
await fetchData();

// Also fetch counts for all statuses
async function fetchStatusCounts() {
  const [completed, pending, voided] = await Promise.all([
    getPayments({ status: 'COMPLETED', limit: 1 }),
    getPayments({ status: 'PENDING', limit: 1 }),
    getPayments({ status: 'VOIDED', limit: 1 })
  ]);
  statusCounts.value = {
    completed: completed.pagination.totalItems,
    pending: pending.pagination.totalItems,
    voided: voided.pagination.totalItems
  };
}
fetchStatusCounts();
</script>
