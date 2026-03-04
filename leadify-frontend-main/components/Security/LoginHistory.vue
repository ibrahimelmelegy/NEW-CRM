<template lang="pug">
.login-history
  .flex.items-center.justify-between.mb-6
    h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('security.loginHistory') }}
    el-button(size="default" @click="refresh" :loading="loading" class="!rounded-xl")
      Icon(name="ph:arrows-clockwise-bold" size="16")
      span.ml-1 {{ $t('common.refresh') }}

  //- Filters
  .flex.items-center.flex-wrap.gap-3.mb-6
    el-date-picker(
      v-model="dateRange"
      type="daterange"
      :range-separator="$t('common.to')"
      :start-placeholder="$t('security.startDate')"
      :end-placeholder="$t('security.endDate')"
      size="large"
      @change="applyFilters"
      class="!rounded-xl"
      value-format="YYYY-MM-DD"
    )
    el-select(
      v-model="statusFilter"
      clearable
      :placeholder="$t('security.allStatuses')"
      @change="applyFilters"
      size="large"
      class="w-40"
    )
      el-option(:label="$t('security.allStatuses')" value="")
      el-option(:label="$t('security.statusSuccess')" value="SUCCESS")
      el-option(:label="$t('security.statusFailed')" value="FAILED")
      el-option(:label="$t('security.statusBlocked')" value="BLOCKED")

  //- Table
  div(v-loading="loading")
    el-table(:data="historyDocs" style="width: 100%")
      el-table-column(:label="$t('security.date')" width="190")
        template(#default="{ row }")
          .text-sm {{ formatDate(row.createdAt) }}

      el-table-column(:label="$t('security.ipAddress')" width="160")
        template(#default="{ row }")
          span.font-mono.text-sm(style="color: var(--text-primary)") {{ row.ip }}

      el-table-column(:label="$t('security.deviceBrowser')" min-width="250")
        template(#default="{ row }")
          .text-sm(style="color: var(--text-secondary)") {{ parseUserAgent(row.userAgent) }}

      el-table-column(:label="$t('security.location')" width="160")
        template(#default="{ row }")
          span.text-sm(style="color: var(--text-secondary)") {{ row.location || '--' }}

      el-table-column(:label="$t('security.status')" width="130" align="center")
        template(#default="{ row }")
          el-tag(
            :type="getStatusType(row.status)"
            effect="dark"
            size="small"
            round
          ) {{ row.status }}

      el-table-column(:label="$t('security.reason')" min-width="180")
        template(#default="{ row }")
          span.text-xs(style="color: var(--text-muted)") {{ row.failReason || '--' }}

      template(#empty)
        .py-8.text-center
          Icon(name="ph:clock-counter-clockwise-bold" size="48" style="color: var(--text-muted)")
          p.mt-2(style="color: var(--text-muted)") {{ $t('security.noLoginHistory') }}

    //- Pagination
    .flex.items-center.justify-between.mt-5.px-2(v-if="pagination && pagination.totalPages > 1")
      span.text-xs(style="color: var(--text-muted)") {{ pagination.totalItems }} {{ $t('common.entries') }}
      el-pagination(
        background
        style="direction:ltr"
        :pager-count="4"
        v-model:current-page="currentPage"
        :page-size="pagination.limit"
        layout="prev, pager, next"
        :total="pagination.totalItems"
        @current-change="onPageChange"
      )
</template>

<script setup lang="ts">
import { useSecurity, type LoginHistoryEntry, type LoginHistoryFilters } from '~/composables/useSecurity';

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const { loginHistory, loading, fetchLoginHistory } = useSecurity();

const dateRange = ref<[string, string] | null>(null);
const statusFilter = ref('');
const currentPage = ref(1);
const pageSize = 20;

const historyDocs = computed(() => loginHistory.value?.docs || []);
const pagination = computed(() => loginHistory.value?.pagination || null);

onMounted(async () => {
  await loadHistory();
});

async function loadHistory() {
  const filters: LoginHistoryFilters = {
    page: currentPage.value,
    limit: pageSize
  };

  if (statusFilter.value) {
    filters.status = statusFilter.value;
  }

  if (dateRange.value && dateRange.value[0]) {
    filters.startDate = dateRange.value[0];
  }
  if (dateRange.value && dateRange.value[1]) {
    filters.endDate = dateRange.value[1];
  }

  await fetchLoginHistory(filters);
}

function applyFilters() {
  currentPage.value = 1;
  loadHistory();
}

function onPageChange(page: number) {
  currentPage.value = page;
  loadHistory();
}

async function refresh() {
  await loadHistory();
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  );
}

function getStatusType(status: string): 'success' | 'danger' | 'warning' | 'info' {
  switch (status) {
    case 'SUCCESS':
      return 'success';
    case 'FAILED':
      return 'danger';
    case 'BLOCKED':
      return 'warning';
    default:
      return 'info';
  }
}

function parseUserAgent(ua: string): string {
  if (!ua) return '--';
  // Simple user-agent parsing
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome - ' + extractOS(ua);
  if (ua.includes('Firefox')) return 'Firefox - ' + extractOS(ua);
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari - ' + extractOS(ua);
  if (ua.includes('Edg')) return 'Edge - ' + extractOS(ua);
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera - ' + extractOS(ua);
  // Truncate if too long
  return ua.length > 60 ? ua.substring(0, 60) + '...' : ua;
}

function extractOS(ua: string): string {
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone')) return 'iOS';
  return 'Unknown';
}
</script>
