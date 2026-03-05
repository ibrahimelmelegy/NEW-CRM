<template lang="pug">
div
  ModuleHeader(
    :title="$t('zakaat.title')"
    :subtitle="$t('zakaat.subtitle')"
    :actions="headerActions"
  )

  StatCards(:stats="summaryStats")

  //- Table
  .glass-card.animate-entrance(style="animation-delay: 0.15s")
    el-table(:data="assessments" v-loading="loading" stripe style="width: 100%" @row-click="handleRowClick")
      el-table-column(:label="$t('zakaat.fiscalYear')" prop="fiscalYear" width="140")
        template(#default="{ row }")
          .font-bold(style="color: var(--text-primary)") {{ row.fiscalYear }}
      el-table-column(:label="$t('zakaat.assessmentDate')" width="160")
        template(#default="{ row }")
          span {{ formatDate(row.assessmentDate) }}
      el-table-column(:label="$t('zakaat.zakaatableBase')" width="180" align="right")
        template(#default="{ row }")
          span {{ formatCurrency(row.zakaatableBase) }}
      el-table-column(:label="$t('zakaat.zakaatRate')" width="120" align="center")
        template(#default="{ row }")
          span {{ row.zakaatRate || 2.5 }}%
      el-table-column(:label="$t('zakaat.zakaatDue')" width="160" align="right")
        template(#default="{ row }")
          span.font-bold(style="color: var(--accent-color)") {{ formatCurrency(row.zakaatDue) }}
      el-table-column(:label="$t('zakaat.statusLabel')" width="140" align="center")
        template(#default="{ row }")
          el-tag(:type="getStatusType(row.status)" size="small" effect="dark") {{ $t(`zakaat.status.${row.status.toLowerCase()}`) }}
      el-table-column(:label="$t('common.actions')" width="200" align="center" fixed="right")
        template(#default="{ row }")
          .flex.items-center.justify-center.gap-1(@click.stop)
            el-tooltip(:content="$t('common.view')")
              el-button(link type="primary" @click="router.push(`/finance/zakaat/${row.id}`)")
                Icon(name="ph:eye-bold" size="16")
            el-tooltip(v-if="row.status === 'DRAFT'" :content="$t('zakaat.calculate')")
              el-button(link type="success" @click="handleCalculate(row)" :loading="calculatingId === row.id")
                Icon(name="ph:calculator-bold" size="16")
            el-tooltip(:content="$t('common.edit')")
              el-button(link type="primary" @click="router.push(`/finance/zakaat/create?edit=${row.id}`)")
                Icon(name="ph:pencil-simple-bold" size="16")
            el-tooltip(v-if="row.status === 'CALCULATED'" :content="$t('zakaat.submit')")
              el-button(link type="warning" @click="handleSubmitAssessment(row)")
                Icon(name="ph:paper-plane-tilt-bold" size="16")
            el-tooltip(v-if="row.status === 'SUBMITTED'" :content="$t('zakaat.markPaid')")
              el-button(link type="success" @click="handleMarkPaid(row)")
                Icon(name="ph:check-circle-bold" size="16")

    //- Pagination
    .flex.justify-center.p-4(v-if="pagination.totalPages > 1")
      el-pagination(
        v-model:current-page="pagination.page"
        :page-size="pagination.limit"
        :total="pagination.totalItems"
        layout="prev, pager, next"
        @current-change="loadData"
      )
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import {
  fetchAssessments,
  fetchZakaatSummary,
  calculateZakaat,
  updateAssessment,
  type ZakaatAssessment,
  type ZakaatStatus
} from '~/composables/useZakaat';

definePageMeta({ middleware: 'permissions' });

const { t } = useI18n();
const router = useRouter();

const loading = ref(false);
const assessments = ref<ZakaatAssessment[]>([]);
const pagination = ref({ page: 1, limit: 20, totalItems: 0, totalPages: 0 });
const calculatingId = ref<number | null>(null);

const summary = ref({ totalAssessments: 0, totalZakaatDue: 0, currentYearStatus: 'N/A' });

const summaryStats = computed(() => [
  { label: t('zakaat.stats.totalAssessments'), value: summary.value.totalAssessments, icon: 'ph:file-text-bold', color: '#7849ff' },
  { label: t('zakaat.stats.totalZakaatDue'), value: formatCurrency(summary.value.totalZakaatDue), icon: 'ph:coins-bold', color: '#22c55e' },
  { label: t('zakaat.stats.currentYearStatus'), value: summary.value.currentYearStatus, icon: 'ph:calendar-check-bold', color: '#e6a23c' }
]);

const headerActions = computed(() => [{ label: t('zakaat.newAssessment'), to: '/finance/zakaat/create', type: 'primary', icon: Plus }]);

function getStatusType(status: ZakaatStatus): string {
  const map: Record<string, string> = {
    DRAFT: 'info',
    CALCULATED: '',
    SUBMITTED: 'warning',
    PAID: 'success'
  };
  return map[status] || 'info';
}

async function loadData() {
  loading.value = true;
  try {
    const query: Record<string, string> = {
      page: String(pagination.value.page),
      limit: String(pagination.value.limit)
    };
    const result = await fetchAssessments(query);
    assessments.value = result.docs;
    pagination.value = { ...pagination.value, ...result.pagination };
    summary.value = await fetchZakaatSummary();
  } finally {
    loading.value = false;
  }
}

function handleRowClick(row: ZakaatAssessment) {
  router.push(`/finance/zakaat/${row.id}`);
}

async function handleCalculate(assessment: ZakaatAssessment) {
  calculatingId.value = assessment.id;
  try {
    const res = await calculateZakaat(assessment.id);
    if (res.success) {
      ElMessage.success(t('zakaat.calculateSuccess'));
      await loadData();
    } else {
      ElMessage.error(res.message || t('errors.generic'));
    }
  } finally {
    calculatingId.value = null;
  }
}

async function handleSubmitAssessment(assessment: ZakaatAssessment) {
  try {
    const res = await updateAssessment(assessment.id, { status: 'SUBMITTED' } as unknown);
    if (res.success) {
      ElMessage.success(t('zakaat.submitSuccess'));
      await loadData();
    }
  } catch {
    ElMessage.error(t('errors.generic'));
  }
}

async function handleMarkPaid(assessment: ZakaatAssessment) {
  try {
    const res = await updateAssessment(assessment.id, {
      status: 'PAID',
      paidAt: new Date().toISOString()
    } as unknown);
    if (res.success) {
      ElMessage.success(t('zakaat.paidSuccess'));
      await loadData();
    }
  } catch {
    ElMessage.error(t('errors.generic'));
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2 }).format(amount || 0);
}

function formatDate(date: string): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

onMounted(loadData);
</script>
