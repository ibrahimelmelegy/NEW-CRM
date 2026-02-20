<template lang="pug">
div
  .flex.items-center.justify-between.mb-6
    div
      h1.text-2xl.font-bold Journal Entries
      p.text-gray-500.mt-1 View and manage accounting journal entries
    el-button(type="primary" size="large" @click="router.push('/finance/accounting/journal-entries/create')")
      span New Entry

  //- Filters
  el-card(shadow="never" class="mb-4")
    .flex.flex-wrap.items-end.gap-4
      div
        label.block.text-sm.font-medium.mb-1 Status
        el-select(v-model="filters.status" placeholder="All Statuses" clearable class="w-40")
          el-option(
            v-for="s in journalStatusOptions"
            :key="s.value"
            :label="s.label"
            :value="s.value"
          )
      div
        label.block.text-sm.font-medium.mb-1 Source Type
        el-select(v-model="filters.sourceType" placeholder="All Types" clearable class="w-40")
          el-option(
            v-for="s in sourceTypeOptions"
            :key="s.value"
            :label="s.label"
            :value="s.value"
          )
      div
        label.block.text-sm.font-medium.mb-1 Date Range
        el-date-picker(
          v-model="filters.dateRange"
          type="daterange"
          range-separator="to"
          start-placeholder="Start"
          end-placeholder="End"
          value-format="YYYY-MM-DD"
          class="w-64"
        )
      el-button(type="primary" @click="loadEntries") Filter
      el-button(@click="resetFilters") Reset

  //- Table
  el-card(shadow="never")
    el-table(
      :data="entries"
      v-loading="loading"
      @row-click="handleRowClick"
      class="w-full cursor-pointer"
      stripe
    )
      el-table-column(prop="entryNumber" label="Entry #" width="120")
      el-table-column(prop="date" label="Date" width="120")
        template(#default="{ row }")
          span {{ formatDate(row.date) }}
      el-table-column(prop="description" label="Description" min-width="200")
        template(#default="{ row }")
          span {{ row.description || '-' }}
      el-table-column(prop="sourceType" label="Source" width="120")
        template(#default="{ row }")
          el-tag(size="small" type="info") {{ row.sourceType }}
      el-table-column(prop="totalDebit" label="Total Debit" width="140" align="right")
        template(#default="{ row }")
          span {{ formatCurrency(row.totalDebit) }}
      el-table-column(prop="totalCredit" label="Total Credit" width="140" align="right")
        template(#default="{ row }")
          span {{ formatCurrency(row.totalCredit) }}
      el-table-column(prop="status" label="Status" width="120" align="center")
        template(#default="{ row }")
          el-tag(
            :type="statusTagType(row.status)"
            size="small"
            effect="light"
          ) {{ row.status }}

    //- Pagination
    .flex.justify-end.mt-4(v-if="pagination.totalPages > 1")
      el-pagination(
        v-model:current-page="currentPage"
        :page-size="pagination.limit"
        :total="pagination.totalItems"
        layout="prev, pager, next"
        @current-change="handlePageChange"
      )
</template>

<script setup lang="ts">
import {
  fetchJournalEntries,
  journalStatusOptions,
  sourceTypeOptions,
  JournalEntryStatus
} from '~/composables/useAccounting';
import type { JournalEntryItem } from '~/composables/useAccounting';

definePageMeta({ middleware: 'permissions' });
const router = useRouter();

const loading = ref(false);
const entries = ref<JournalEntryItem[]>([]);
const currentPage = ref(1);
const pagination = ref({ page: 1, limit: 20, totalItems: 0, totalPages: 0 });

const filters = ref({
  status: '',
  sourceType: '',
  dateRange: null as [string, string] | null
});

function statusTagType(status: string): string {
  switch (status) {
    case JournalEntryStatus.DRAFT: return 'warning';
    case JournalEntryStatus.POSTED: return 'success';
    case JournalEntryStatus.VOIDED: return 'danger';
    default: return 'info';
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
}

async function loadEntries() {
  loading.value = true;
  try {
    const params: Record<string, string> = {
      page: String(currentPage.value),
      limit: '20'
    };
    if (filters.value.status) params.status = filters.value.status;
    if (filters.value.sourceType) params.sourceType = filters.value.sourceType;
    if (filters.value.dateRange && filters.value.dateRange[0]) {
      params.startDate = filters.value.dateRange[0];
      params.endDate = filters.value.dateRange[1];
    }

    const result = await fetchJournalEntries(params);
    entries.value = result.docs;
    pagination.value = result.pagination;
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  filters.value = { status: '', sourceType: '', dateRange: null };
  currentPage.value = 1;
  loadEntries();
}

function handlePageChange(page: number) {
  currentPage.value = page;
  loadEntries();
}

function handleRowClick(row: JournalEntryItem) {
  router.push(`/finance/accounting/journal-entries/${row.id}`);
}

await loadEntries();
</script>
