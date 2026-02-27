<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-8
    div
      .title.font-bold.text-2xl.mb-1(style="color: var(--text-primary)") {{ $t('hr.performance.title') || 'Performance Reviews' }}
      p.text-sm(style="color: var(--text-muted)") {{ $t('hr.performance.subtitle') || 'Track employee performance, set goals, and manage review cycles' }}
    .flex.items-center.gap-x-3
      el-button(size="large" type="primary" @click="openDialog()" class="!rounded-2xl")
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('hr.performance.newReview') || 'New Review' }}

  //- Stats Cards
  .grid.grid-cols-2.gap-4.mb-6(class="lg:grid-cols-4")
    .glass-card.p-5.rounded-2xl.text-center
      .text-2xl.font-bold(style="color: var(--text-primary)") {{ reviews.length }}
      .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.performance.totalReviews') || 'Total Reviews' }}
    .glass-card.p-5.rounded-2xl.text-center
      .text-2xl.font-bold(style="color: #f59e0b") {{ avgRating }}
      .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.performance.avgRating') || 'Average Rating' }}
    .glass-card.p-5.rounded-2xl.text-center
      .text-2xl.font-bold(style="color: #f97316") {{ reviews.filter(r => r.status === 'PENDING').length }}
      .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.performance.pending') || 'Pending' }}
    .glass-card.p-5.rounded-2xl.text-center
      .text-2xl.font-bold(style="color: #22c55e") {{ reviews.filter(r => r.status === 'COMPLETED').length }}
      .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.performance.completed') || 'Completed' }}

  //- Filters
  .flex.items-center.gap-3.mb-4
    el-input(v-model="search" :placeholder="$t('common.search') || 'Search'" clearable style="width: 260px" size="large" class="!rounded-xl")
      template(#prefix)
        Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")
    el-select(v-model="statusFilter" :placeholder="$t('hr.performance.allStatuses') || 'All Statuses'" clearable size="large" style="width: 180px")
      el-option(label="All Statuses" value="")
      el-option(v-for="s in REVIEW_STATUSES" :key="s.value" :label="s.label" :value="s.value")

  //- Table
  .glass-card.rounded-2xl.overflow-hidden
    el-table(:data="filteredReviews" v-loading="loading" style="width: 100%" stripe @row-click="handleRowClick" row-class-name="cursor-pointer")
      el-table-column(:label="$t('hr.performance.employee') || 'Employee'" min-width="180")
        template(#default="{ row }")
          .flex.items-center.gap-3
            .w-9.h-9.rounded-full.flex.items-center.justify-center.shrink-0(style="background: rgba(120, 73, 255, 0.15)")
              span.text-sm.font-bold(style="color: #7849ff") {{ (row.employeeName || '?').charAt(0).toUpperCase() }}
            div
              p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.employeeName || '--' }}
      el-table-column(:label="$t('hr.performance.reviewer') || 'Reviewer'" min-width="160" prop="reviewerName")
        template(#default="{ row }")
          span.text-sm(style="color: var(--text-primary)") {{ row.reviewerName || '--' }}
      el-table-column(:label="$t('hr.performance.period') || 'Period'" min-width="140" prop="period")
        template(#default="{ row }")
          span.text-sm(style="color: var(--text-primary)") {{ row.period || '--' }}
      el-table-column(:label="$t('hr.performance.rating') || 'Rating'" width="140" align="center")
        template(#default="{ row }")
          .flex.items-center.justify-center.gap-2
            el-rate(:model-value="row.overallRating || 0" disabled :max="5" size="small")
            span.text-sm(style="color: var(--text-muted)") {{ row.overallRating || 0 }}/5
      el-table-column(:label="$t('hr.performance.status') || 'Status'" width="140" align="center")
        template(#default="{ row }")
          el-tag(:type="getStatusType(row.status)" effect="dark" size="small" round) {{ row.status }}
      el-table-column(:label="$t('hr.performance.date') || 'Date'" width="140")
        template(#default="{ row }")
          span.text-sm(style="color: var(--text-muted)") {{ formatDate(row.createdAt) }}
      el-table-column(:label="$t('common.actions') || 'Actions'" width="120" align="center")
        template(#default="{ row }")
          .flex.items-center.justify-center.gap-1(@click.stop)
            el-button(text type="primary" size="small" @click="openDialog(row)")
              Icon(name="ph:pencil-bold" size="16")
            el-button(text type="danger" size="small" @click="handleDelete(row)")
              Icon(name="ph:trash-bold" size="16")

  //- Create/Edit Dialog
  el-dialog(v-model="dialogVisible" :title="editingItem ? ($t('hr.performance.editReview') || 'Edit Review') : ($t('hr.performance.newReview') || 'New Review')" width="600px" destroy-on-close)
    el-form(:model="form" label-position="top")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('hr.performance.employee') || 'Employee'" required)
          el-select(v-model="form.employeeId" filterable :placeholder="$t('hr.performance.selectEmployee') || 'Select employee'" class="w-full")
            el-option(v-for="emp in employees" :key="emp.id" :label="emp.name" :value="emp.id")
        el-form-item(:label="$t('hr.performance.reviewer') || 'Reviewer'" required)
          el-select(v-model="form.reviewerId" filterable :placeholder="$t('hr.performance.selectReviewer') || 'Select reviewer'" class="w-full")
            el-option(v-for="emp in employees" :key="emp.id" :label="emp.name" :value="emp.id")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('hr.performance.period') || 'Period'" required)
          el-select(v-model="form.period" :placeholder="$t('hr.performance.selectPeriod') || 'Select period'" class="w-full")
            el-option(label="Q1 2026" value="Q1-2026")
            el-option(label="Q2 2026" value="Q2-2026")
            el-option(label="Q3 2026" value="Q3-2026")
            el-option(label="Q4 2026" value="Q4-2026")
            el-option(label="Annual 2025" value="ANNUAL-2025")
            el-option(label="Annual 2026" value="ANNUAL-2026")
        el-form-item(:label="$t('hr.performance.status') || 'Status'")
          el-select(v-model="form.status" class="w-full")
            el-option(v-for="s in REVIEW_STATUSES" :key="s.value" :label="s.label" :value="s.value")
      el-form-item(:label="$t('hr.performance.overallRating') || 'Overall Rating'")
        el-rate(v-model="form.overallRating" :max="5" allow-half show-score score-template="{value}/5")
      el-form-item(:label="$t('hr.performance.goals') || 'Goals'")
        el-input(v-model="form.goals" type="textarea" :rows="3" :placeholder="$t('hr.performance.goalsPlaceholder') || 'Enter goals for this review period...'")
      el-form-item(:label="$t('hr.performance.comments') || 'Comments'")
        el-input(v-model="form.comments" type="textarea" :rows="3" :placeholder="$t('hr.performance.commentsPlaceholder') || 'Enter review comments...'")
    template(#footer)
      el-button(@click="dialogVisible = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" @click="handleSave" :loading="saving") {{ $t('common.save') || 'Save' }}
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
    ElNotification({ type: 'warning', title: t('common.warning') || 'Warning', message: t('common.fillRequired') || 'Please fill all required fields' });
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
    ElNotification({ type: 'success', title: t('common.success') || 'Success', message: t('common.saved') || 'Saved successfully' });
  } catch {
    ElNotification({ type: 'error', title: t('common.error') || 'Error', message: t('common.error') || 'An error occurred' });
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      t('common.confirmDelete') || 'Are you sure you want to delete this review?',
      t('common.warning') || 'Warning',
      { type: 'warning' }
    );
    loading.value = true;
    await useApiFetch(`hr/performance/${row.id}`, 'DELETE');
    await loadData();
    ElNotification({ type: 'success', title: t('common.success') || 'Success', message: t('common.deleted') || 'Deleted successfully' });
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
      useApiFetch('hr/performance'),
      useApiFetch('hr/employees?limit=500')
    ]);
    if (reviewsRes?.success && reviewsRes.body) {
      const data = reviewsRes.body as any;
      reviews.value = data.docs || data || [];
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

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.glass-card {
  background: var(--bg-elevated, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--border-default, rgba(255, 255, 255, 0.08));
  border-radius: 16px;
}
</style>
