<template lang="pug">
div
  ModuleHeader(
    :title="$t('zatca.title')"
    :subtitle="$t('zatca.subtitle')"
    :actions="headerActions"
  )

  StatCards(:stats="summaryStats")

  //- Filters
  .glass-card.p-4.mb-6.animate-entrance(style="animation-delay: 0.15s")
    .flex.flex-wrap.items-center.gap-4
      el-select(
        v-model="filters.status"
        :placeholder="$t('zatca.allStatuses')"
        clearable
        style="width: 180px"
        @change="loadData"
      )
        el-option(
          v-for="s in zatcaStatusOptions"
          :key="s.value"
          :label="$t(`zatca.status.${s.value.toLowerCase()}`)"
          :value="s.value"
        )
      el-select(
        v-model="filters.invoiceType"
        :placeholder="$t('zatca.allTypes')"
        clearable
        style="width: 180px"
        @change="loadData"
      )
        el-option(
          v-for="t in zatcaInvoiceTypes"
          :key="t.value"
          :label="$t(`zatca.types.${t.value.toLowerCase()}`)"
          :value="t.value"
        )
      el-date-picker(
        v-model="filters.dateRange"
        type="daterange"
        :start-placeholder="$t('common.filter') + ' ' + $t('zatca.from')"
        :end-placeholder="$t('zatca.to')"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        @change="loadData"
        style="max-width: 300px"
      )
      el-input(
        v-model="filters.search"
        :placeholder="$t('zatca.searchInvoices')"
        clearable
        style="width: 240px"
        @input="debouncedSearch"
      )
        template(#prefix)
          Icon(name="ph:magnifying-glass" size="16")

  //- Table
  .glass-card.animate-entrance(style="animation-delay: 0.2s")
    el-table(:data="invoices" v-loading="loading" stripe style="width: 100%")
      el-table-column(:label="$t('zatca.invoiceNumber')" prop="invoiceNumber" width="160")
        template(#default="{ row }")
          .font-bold(style="color: var(--text-primary)") {{ row.invoiceNumber }}
      el-table-column(:label="$t('zatca.invoiceType')" width="140")
        template(#default="{ row }")
          el-tag(size="small" effect="plain") {{ $t(`zatca.types.${row.invoiceType.toLowerCase()}`) }}
      el-table-column(:label="$t('zatca.buyerName')" prop="buyerName" min-width="180")
      el-table-column(:label="$t('zatca.taxableAmount')" width="140" align="right")
        template(#default="{ row }")
          span {{ formatCurrency(row.taxableAmount) }}
      el-table-column(:label="$t('zatca.vatAmount')" width="120" align="right")
        template(#default="{ row }")
          span(style="color: var(--text-muted)") {{ formatCurrency(row.vatAmount) }}
      el-table-column(:label="$t('zatca.totalAmount')" width="140" align="right")
        template(#default="{ row }")
          span.font-bold {{ formatCurrency(row.totalAmount) }}
      el-table-column(:label="$t('zatca.statusLabel')" width="130" align="center")
        template(#default="{ row }")
          el-tag(:type="getStatusType(row.status)" size="small" effect="dark") {{ $t(`zatca.status.${row.status.toLowerCase()}`) }}
      el-table-column(:label="$t('zatca.submittedAt')" width="140")
        template(#default="{ row }")
          span(v-if="row.submittedAt") {{ formatDate(row.submittedAt) }}
          span.text-xs(v-else style="color: var(--text-muted)") --
      el-table-column(:label="$t('common.actions')" width="180" align="center" fixed="right")
        template(#default="{ row }")
          .flex.items-center.justify-center.gap-1
            el-tooltip(:content="$t('common.view')")
              el-button(link type="primary" @click="router.push(`/finance/zatca/${row.id}`)")
                Icon(name="ph:eye-bold" size="16")
            el-tooltip(v-if="row.status === 'DRAFT' || row.status === 'REJECTED'" :content="$t('zatca.submitToZatca')")
              el-button(link type="success" @click="handleSubmit(row)" :loading="submittingId === row.id")
                Icon(name="ph:paper-plane-tilt-bold" size="16")
            el-tooltip(:content="$t('zatca.downloadXml')")
              el-button(link type="info" @click="handleDownloadXml(row.id)")
                Icon(name="ph:file-xml-bold" size="16")
            el-tooltip(v-if="row.qrCode" :content="$t('zatca.viewQr')")
              el-button(link type="warning" @click="showQrDialog(row)")
                Icon(name="ph:qr-code-bold" size="16")

    //- Pagination
    .flex.justify-center.p-4(v-if="pagination.totalPages > 1")
      el-pagination(
        v-model:current-page="pagination.page"
        :page-size="pagination.limit"
        :total="pagination.totalItems"
        layout="prev, pager, next"
        @current-change="loadData"
      )

  //- QR Code Dialog
  el-dialog(v-model="qrDialogVisible" :title="$t('zatca.qrCode')" width="400px" align-center)
    .flex.flex-col.items-center.gap-4.py-4
      .p-4.bg-white.rounded-2xl
        img(v-if="selectedQr" :src="selectedQr" alt="QR Code" style="width: 240px; height: 240px")
      p.text-sm.text-center(style="color: var(--text-muted)") {{ $t('zatca.qrDescription') }}
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  fetchZatcaInvoices,
  fetchZatcaSummary,
  submitToZatca,
  downloadZatcaXml,
  zatcaStatusOptions,
  zatcaInvoiceTypes,
  type ZatcaInvoice,
  type ZatcaInvoiceStatus
} from '~/composables/useZatca';

definePageMeta({ middleware: 'permissions' });

const { t } = useI18n();
const router = useRouter();

const loading = ref(false);
const invoices = ref<ZatcaInvoice[]>([]);
const pagination = ref({ page: 1, limit: 20, totalItems: 0, totalPages: 0 });
const submittingId = ref<number | null>(null);
const qrDialogVisible = ref(false);
const selectedQr = ref('');

const filters = ref({
  status: '',
  invoiceType: '',
  dateRange: null as [string, string] | null,
  search: ''
});

// Summary
const summary = ref({ total: 0, pending: 0, cleared: 0, rejected: 0 });

const summaryStats = computed(() => [
  { label: t('zatca.stats.totalInvoices'), value: summary.value.total, icon: 'ph:file-text-bold', color: '#7849ff' },
  { label: t('zatca.stats.pendingSubmission'), value: summary.value.pending, icon: 'ph:clock-bold', color: '#e6a23c' },
  { label: t('zatca.stats.cleared'), value: summary.value.cleared, icon: 'ph:check-circle-bold', color: '#67c23a' },
  { label: t('zatca.stats.rejected'), value: summary.value.rejected, icon: 'ph:x-circle-bold', color: '#f56c6c' }
]);

const headerActions = computed(() => [{ label: t('zatca.createInvoice'), to: '/finance/zatca/create', type: 'primary', icon: Plus }]);

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout>;
function debouncedSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => loadData(), 400);
}

async function loadData() {
  loading.value = true;
  try {
    const query: Record<string, string> = {
      page: String(pagination.value.page),
      limit: String(pagination.value.limit)
    };
    if (filters.value.status) query.status = filters.value.status;
    if (filters.value.invoiceType) query.invoiceType = filters.value.invoiceType;
    if (filters.value.search) query.search = filters.value.search;
    if (filters.value.dateRange && filters.value.dateRange[0]) {
      query.startDate = filters.value.dateRange[0];
      query.endDate = filters.value.dateRange[1];
    }

    const result = await fetchZatcaInvoices(query);
    invoices.value = result.docs;
    pagination.value = { ...pagination.value, ...result.pagination };

    summary.value = await fetchZatcaSummary();
  } finally {
    loading.value = false;
  }
}

function getStatusType(status: ZatcaInvoiceStatus): string {
  const map: Record<string, string> = {
    DRAFT: 'info',
    PENDING: 'warning',
    REPORTED: '',
    CLEARED: 'success',
    REJECTED: 'danger'
  };
  return map[status] || 'info';
}

async function handleSubmit(invoice: ZatcaInvoice) {
  try {
    await ElMessageBox.confirm(t('zatca.submitConfirm'), t('zatca.submitToZatca'), {
      confirmButtonText: t('common.submit'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    });
    submittingId.value = invoice.id;
    const res = await submitToZatca(invoice.id);
    if (res.success) {
      ElMessage.success(t('zatca.submitSuccess'));
      await loadData();
    } else {
      ElMessage.error(res.message || t('zatca.submitFailed'));
    }
  } catch {
    // User cancelled
  } finally {
    submittingId.value = null;
  }
}

async function handleDownloadXml(id: number) {
  try {
    await downloadZatcaXml(id);
  } catch {
    ElMessage.error(t('errors.generic'));
  }
}

function showQrDialog(invoice: ZatcaInvoice) {
  selectedQr.value = invoice.qrCode || '';
  qrDialogVisible.value = true;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2 }).format(amount || 0);
}

function formatDate(date: string): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

onMounted(loadData);

onUnmounted(() => {
  clearTimeout(searchTimeout);
});
</script>

<style lang="scss" scoped>
.glass-card {
  border-radius: 16px;
}
</style>
