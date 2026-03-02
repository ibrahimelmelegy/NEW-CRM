<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-8
    div
      .title.font-bold.text-2xl.mb-1(style="color: var(--text-primary)") {{ $t('hr.performance.title') }}
      p.text-sm(style="color: var(--text-muted)") {{ $t('hr.performance.subtitle') }}
    .flex.items-center.gap-x-3
      el-button(size="large" type="primary" @click="openDialog()" class="!rounded-2xl")
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('hr.performance.newReview') }}

  //- Stats Cards
  .grid.grid-cols-2.gap-4.mb-6(class="lg:grid-cols-4")
    .glass-card.p-5.rounded-2xl.text-center
      .text-2xl.font-bold(style="color: var(--text-primary)") {{ reviews.length }}
      .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.performance.totalReviews') }}
    .glass-card.p-5.rounded-2xl.text-center
      .text-2xl.font-bold(style="color: #f59e0b") {{ avgRating }}
      .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.performance.avgRating') }}
    .glass-card.p-5.rounded-2xl.text-center
      .text-2xl.font-bold(style="color: #f97316") {{ reviews.filter(r => r.status === 'PENDING').length }}
      .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.performance.pending') }}
    .glass-card.p-5.rounded-2xl.text-center
      .text-2xl.font-bold(style="color: #22c55e") {{ reviews.filter(r => r.status === 'COMPLETED').length }}
      .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.performance.completed') }}

  //- Rating Distribution Section
  .glass-card.p-6.rounded-2xl.mb-6
    .flex.items-center.justify-between.mb-4
      .flex.items-center.gap-2
        Icon(name="ph:chart-bar-horizontal-bold" size="20" style="color: #7849ff")
        span.text-sm.font-semibold(style="color: var(--text-primary)") Rating Distribution
      el-select(v-model="distributionPeriod" size="small" style="width: 160px" @change="loadDistribution")
        el-option(label="Q1 2026" value="Q1-2026")
        el-option(label="Q2 2026" value="Q2-2026")
        el-option(label="Q3 2026" value="Q3-2026")
        el-option(label="Q4 2026" value="Q4-2026")
        el-option(label="Annual 2025" value="ANNUAL-2025")
        el-option(label="Annual 2026" value="ANNUAL-2026")
    .space-y-3(v-loading="distributionLoading")
      //- Outstanding (4-5)
      .flex.items-center.gap-3
        .w-40.text-xs.font-medium.shrink-0(style="color: #22c55e") Outstanding (4-5)
        .flex-1.relative
          .h-7.rounded-lg.overflow-hidden(style="background: rgba(255,255,255,0.05)")
            .h-full.rounded-lg.transition-all.duration-500(
              :style="{ width: distributionBarWidth(distribution.outstanding), background: 'linear-gradient(90deg, #22c55e, #16a34a)' }"
            )
        .w-20.text-xs.text-right.shrink-0(style="color: var(--text-primary)")
          span.font-bold {{ distribution.outstanding }}
          span(style="color: var(--text-muted)") &nbsp;({{ distributionPct(distribution.outstanding) }}%)
      //- Exceeds (3-4)
      .flex.items-center.gap-3
        .w-40.text-xs.font-medium.shrink-0(style="color: #3b82f6") Exceeds (3-4)
        .flex-1.relative
          .h-7.rounded-lg.overflow-hidden(style="background: rgba(255,255,255,0.05)")
            .h-full.rounded-lg.transition-all.duration-500(
              :style="{ width: distributionBarWidth(distribution.exceeds), background: 'linear-gradient(90deg, #3b82f6, #2563eb)' }"
            )
        .w-20.text-xs.text-right.shrink-0(style="color: var(--text-primary)")
          span.font-bold {{ distribution.exceeds }}
          span(style="color: var(--text-muted)") &nbsp;({{ distributionPct(distribution.exceeds) }}%)
      //- Meets (2-3)
      .flex.items-center.gap-3
        .w-40.text-xs.font-medium.shrink-0(style="color: #f59e0b") Meets (2-3)
        .flex-1.relative
          .h-7.rounded-lg.overflow-hidden(style="background: rgba(255,255,255,0.05)")
            .h-full.rounded-lg.transition-all.duration-500(
              :style="{ width: distributionBarWidth(distribution.meets), background: 'linear-gradient(90deg, #f59e0b, #d97706)' }"
            )
        .w-20.text-xs.text-right.shrink-0(style="color: var(--text-primary)")
          span.font-bold {{ distribution.meets }}
          span(style="color: var(--text-muted)") &nbsp;({{ distributionPct(distribution.meets) }}%)
      //- Needs Improvement (1-2)
      .flex.items-center.gap-3
        .w-40.text-xs.font-medium.shrink-0(style="color: #ef4444") Needs Improvement (1-2)
        .flex-1.relative
          .h-7.rounded-lg.overflow-hidden(style="background: rgba(255,255,255,0.05)")
            .h-full.rounded-lg.transition-all.duration-500(
              :style="{ width: distributionBarWidth(distribution.needsImprovement), background: 'linear-gradient(90deg, #ef4444, #dc2626)' }"
            )
        .w-20.text-xs.text-right.shrink-0(style="color: var(--text-primary)")
          span.font-bold {{ distribution.needsImprovement }}
          span(style="color: var(--text-muted)") &nbsp;({{ distributionPct(distribution.needsImprovement) }}%)

  //- Filters
  .flex.items-center.gap-3.mb-4
    el-input(v-model="search" :placeholder="$t('common.search')" clearable style="width: 260px" size="large" class="!rounded-xl")
      template(#prefix)
        Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")
    el-select(v-model="statusFilter" :placeholder="$t('hr.performance.allStatuses')" clearable size="large" style="width: 180px")
      el-option(label="All Statuses" value="")
      el-option(v-for="s in REVIEW_STATUSES" :key="s.value" :label="s.label" :value="s.value")

  //- Table
  .glass-card.rounded-2xl.overflow-hidden
    el-table(:data="filteredReviews" v-loading="loading" style="width: 100%" stripe @row-click="handleRowClick" row-class-name="cursor-pointer")
      el-table-column(:label="$t('hr.performance.employee')" min-width="180")
        template(#default="{ row }")
          .flex.items-center.gap-3
            .w-9.h-9.rounded-full.flex.items-center.justify-center.shrink-0(style="background: rgba(120, 73, 255, 0.15)")
              span.text-sm.font-bold(style="color: #7849ff") {{ (row.employeeName || '?').charAt(0).toUpperCase() }}
            div
              p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.employeeName || '--' }}
      el-table-column(:label="$t('hr.performance.reviewer')" min-width="160" prop="reviewerName")
        template(#default="{ row }")
          span.text-sm(style="color: var(--text-primary)") {{ row.reviewerName || '--' }}
      el-table-column(:label="$t('hr.performance.period')" min-width="140" prop="period")
        template(#default="{ row }")
          span.text-sm(style="color: var(--text-primary)") {{ row.period || '--' }}
      el-table-column(:label="$t('hr.performance.rating')" width="140" align="center")
        template(#default="{ row }")
          .flex.items-center.justify-center.gap-2
            el-rate(:model-value="row.overallRating || 0" disabled :max="5" size="small")
            span.text-sm(style="color: var(--text-muted)") {{ row.overallRating || 0 }}/5
      el-table-column(:label="$t('hr.performance.status')" width="140" align="center")
        template(#default="{ row }")
          el-tag(:type="getStatusType(row.status)" effect="dark" size="small" round) {{ row.status }}
      el-table-column(:label="$t('hr.performance.date')" width="140")
        template(#default="{ row }")
          span.text-sm(style="color: var(--text-muted)") {{ formatDate(row.createdAt) }}
      el-table-column(:label="$t('common.actions')" width="120" align="center")
        template(#default="{ row }")
          .flex.items-center.justify-center.gap-1(@click.stop)
            el-button(text type="primary" size="small" @click="openDialog(row)")
              Icon(name="ph:pencil-bold" size="16")
            el-button(text type="danger" size="small" @click="handleDelete(row)")
              Icon(name="ph:trash-bold" size="16")

    .flex.justify-end.mt-4
      el-pagination(
        :current-page="pagination.page"
        :page-size="pagination.limit"
        :total="pagination.total"
        layout="total, prev, pager, next"
        @current-change="(p: number) => { pagination.page = p; loadData() }"
      )

  //- Create/Edit Dialog
  el-dialog(v-model="dialogVisible" :title="editingItem ? $t('hr.performance.editReview') : $t('hr.performance.newReview')" width="600px" destroy-on-close)
    el-form(:model="form" label-position="top")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('hr.performance.employee')" required)
          el-select(v-model="form.employeeId" filterable :placeholder="$t('hr.performance.selectEmployee')" class="w-full")
            el-option(v-for="emp in employees" :key="emp.id" :label="emp.name" :value="emp.id")
        el-form-item(:label="$t('hr.performance.reviewer')" required)
          el-select(v-model="form.reviewerId" filterable :placeholder="$t('hr.performance.selectReviewer')" class="w-full")
            el-option(v-for="emp in employees" :key="emp.id" :label="emp.name" :value="emp.id")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('hr.performance.period')" required)
          el-select(v-model="form.period" :placeholder="$t('hr.performance.selectPeriod')" class="w-full")
            el-option(label="Q1 2026" value="Q1-2026")
            el-option(label="Q2 2026" value="Q2-2026")
            el-option(label="Q3 2026" value="Q3-2026")
            el-option(label="Q4 2026" value="Q4-2026")
            el-option(label="Annual 2025" value="ANNUAL-2025")
            el-option(label="Annual 2026" value="ANNUAL-2026")
        el-form-item(:label="$t('hr.performance.status')")
          el-select(v-model="form.status" class="w-full")
            el-option(v-for="s in REVIEW_STATUSES" :key="s.value" :label="s.label" :value="s.value")
      el-form-item(:label="$t('hr.performance.overallRating')")
        el-rate(v-model="form.overallRating" :max="5" allow-half show-score score-template="{value}/5")
      el-form-item(:label="$t('hr.performance.goals')")
        el-input(v-model="form.goals" type="textarea" :rows="3" :placeholder="$t('hr.performance.goalsPlaceholder')")
      el-form-item(:label="$t('hr.performance.comments')")
        el-input(v-model="form.comments" type="textarea" :rows="3" :placeholder="$t('hr.performance.commentsPlaceholder')")
    template(#footer)
      el-button(@click="dialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleSave" :loading="saving") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { ElNotification, ElMessageBox } from 'element-plus';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editingItem = ref<any>(null);
const search = ref('');
const statusFilter = ref('');

const reviews = ref<any[]>([]);
const employees = ref<any[]>([]);
const pagination = reactive({ page: 1, limit: 20, total: 0 });

// Distribution state
const distributionPeriod = ref('Q1-2026');
const distributionLoading = ref(false);
const distribution = reactive({
  outstanding: 0,
  exceeds: 0,
  meets: 0,
  needsImprovement: 0
});

const REVIEW_STATUSES = [
  { value: 'PENDING', label: 'Pending', type: 'warning' },
  { value: 'IN_PROGRESS', label: 'In Progress', type: '' },
  { value: 'COMPLETED', label: 'Completed', type: 'success' },
  { value: 'CANCELLED', label: 'Cancelled', type: 'info' }
];

const form = reactive({
  employeeId: '' as string | number,
  reviewerId: '' as string | number,
  period: '',
  overallRating: 0,
  status: 'PENDING',
  comments: '',
  goals: ''
});

const avgRating = computed(() => {
  const rated = reviews.value.filter(r => r.overallRating > 0);
  if (!rated.length) return '0.0';
  return (rated.reduce((sum: number, r: any) => sum + r.overallRating, 0) / rated.length).toFixed(1);
});

const filteredReviews = computed(() => {
  let data = reviews.value;
  if (statusFilter.value) {
    data = data.filter(r => r.status === statusFilter.value);
  }
  if (search.value) {
    const q = search.value.toLowerCase();
    data = data.filter(r =>
      (r.employeeName || '').toLowerCase().includes(q) ||
      (r.reviewerName || '').toLowerCase().includes(q) ||
      (r.period || '').toLowerCase().includes(q)
    );
  }
  return data;
});

function getStatusType(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'warning',
    IN_PROGRESS: '',
    COMPLETED: 'success',
    CANCELLED: 'info'
  };
  return map[status] || 'info';
}

function formatDate(d: string) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

function handleRowClick(row: any) {
  openDialog(row);
}

function resetForm() {
  form.employeeId = '';
  form.reviewerId = '';
  form.period = '';
  form.overallRating = 0;
  form.status = 'PENDING';
  form.comments = '';
  form.goals = '';
}

function openDialog(item?: any) {
  if (item?.id) {
    editingItem.value = item;
    form.employeeId = item.employeeId || '';
    form.reviewerId = item.reviewerId || '';
    form.period = item.period || '';
    form.overallRating = item.overallRating || 0;
    form.status = item.status || 'PENDING';
    form.comments = item.comments || '';
    form.goals = item.goals || '';
  } else {
    editingItem.value = null;
    resetForm();
  }
  dialogVisible.value = true;
}

async function handleSave() {
  if (!form.employeeId || !form.reviewerId || !form.period) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }
  saving.value = true;
  try {
    const payload = { ...form };
    if (editingItem.value) {
      await useApiFetch(`hr/performance/${editingItem.value.id}`, 'PUT', payload);
    } else {
      await useApiFetch('hr/performance', 'POST', payload);
    }
    await loadData();
    dialogVisible.value = false;
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      t('common.confirmDelete'),
      t('common.warning'),
      { type: 'warning' }
    );
    loading.value = true;
    await useApiFetch(`hr/performance/${row.id}`, 'DELETE');
    await loadData();
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
  } catch {
    // User cancelled or error
  } finally {
    loading.value = false;
  }
}

async function loadData() {
  loading.value = true;
  try {
    const [reviewsRes, empRes] = await Promise.all([
      useApiFetch(`hr/performance?page=${pagination.page}&limit=${pagination.limit}`),
      useApiFetch('hr/employees?limit=500')
    ]);
    if (reviewsRes?.success && reviewsRes.body) {
      const data = reviewsRes.body as any;
      reviews.value = data.rows || data.docs || data || [];
      pagination.total = data.count ?? data.total ?? reviews.value.length;
    }
    if (empRes?.success && empRes.body) {
      const data = empRes.body as any;
      const docs = data.docs || data || [];
      employees.value = docs.map((e: any) => ({
        id: e.id,
        name: e.firstName ? `${e.firstName} ${e.lastName || ''}`.trim() : e.name || `Employee #${e.id}`
      }));
    }
  } finally {
    loading.value = false;
  }
}

// Distribution helpers
function distributionTotal(): number {
  return distribution.outstanding + distribution.exceeds + distribution.meets + distribution.needsImprovement;
}

function distributionPct(count: number): string {
  const total = distributionTotal();
  if (!total) return '0';
  return Math.round((count / total) * 100).toString();
}

function distributionBarWidth(count: number): string {
  const total = distributionTotal();
  if (!total) return '0%';
  return Math.max(2, Math.round((count / total) * 100)) + '%';
}

async function loadDistribution() {
  distributionLoading.value = true;
  try {
    const res = await useApiFetch(`hr/performance/distribution?period=${distributionPeriod.value}`);
    if (res?.success && res.body) {
      const d = res.body as any;
      distribution.outstanding = d.outstanding ?? 0;
      distribution.exceeds = d.exceeds ?? 0;
      distribution.meets = d.meets ?? 0;
      distribution.needsImprovement = d.needsImprovement ?? 0;
    }
  } catch {
    // Distribution is supplementary; silently ignore errors
  } finally {
    distributionLoading.value = false;
  }
}

onMounted(() => {
  loadData();
  loadDistribution();
});
</script>

<style lang="scss" scoped>
.glass-card {
  background: var(--bg-elevated, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--border-default, rgba(255, 255, 255, 0.08));
  border-radius: 16px;
}
</style>
