<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-8
    div
      .title.font-bold.text-2xl.mb-1(style="color: var(--text-primary)") {{ $t('hr.training.title') || 'Training & LMS' }}
      p.text-sm(style="color: var(--text-muted)") {{ $t('hr.training.subtitle') || 'Manage training programs, track enrollments, and monitor progress' }}
    .flex.items-center.gap-x-3
      el-button(v-if="activeTab === 'programs'" size="large" type="primary" @click="openProgramDialog()" class="!rounded-2xl")
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('hr.training.newProgram') || 'New Program' }}
      el-button(v-if="activeTab === 'enrollments'" size="large" type="primary" @click="openEnrollmentDialog()" class="!rounded-2xl")
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('hr.training.newEnrollment') || 'New Enrollment' }}

  //- Training Dashboard
  .glass-card.p-6.rounded-2xl.mb-6(v-loading="dashboardLoading")
    .flex.items-center.gap-2.mb-4
      Icon(name="ph:chart-pie-slice-bold" size="20" style="color: #7849ff")
      span.text-sm.font-semibold(style="color: var(--text-primary)") Training Dashboard
    el-row(:gutter="16")
      el-col(:xs="12" :sm="8" :md="4")
        .glass-card.p-4.rounded-xl.text-center
          .flex.items-center.justify-center.mb-2
            Icon(name="ph:graduation-cap-bold" size="20" style="color: #7849ff")
          .text-2xl.font-bold(style="color: #7849ff") {{ dashboardData.totalPrograms }}
          .text-xs.mt-1(style="color: var(--text-muted)") Total Programs
      el-col(:xs="12" :sm="8" :md="4")
        .glass-card.p-4.rounded-xl.text-center
          .flex.items-center.justify-center.mb-2
            Icon(name="ph:users-bold" size="20" style="color: #3b82f6")
          .text-2xl.font-bold(style="color: #3b82f6") {{ dashboardData.activeEnrollments }}
          .text-xs.mt-1(style="color: var(--text-muted)") Active Enrollments
      el-col(:xs="12" :sm="8" :md="4")
        .glass-card.p-4.rounded-xl.text-center
          .flex.items-center.justify-center.mb-2
            Icon(name="ph:check-circle-bold" size="20" style="color: #22c55e")
          .text-2xl.font-bold(style="color: #22c55e") {{ dashboardData.completionRate }}%
          .text-xs.mt-1(style="color: var(--text-muted)") Completion Rate
      el-col(:xs="12" :sm="8" :md="4")
        .glass-card.p-4.rounded-xl.text-center
          .flex.items-center.justify-center.mb-2
            Icon(name="ph:calendar-bold" size="20" style="color: #f59e0b")
          .text-2xl.font-bold(style="color: #f59e0b") {{ dashboardData.upcoming }}
          .text-xs.mt-1(style="color: var(--text-muted)") Upcoming Programs
      el-col(:xs="24" :sm="8" :md="4")
        .glass-card.p-4.rounded-xl.text-center
          .flex.items-center.justify-center.mb-2
            Icon(name="ph:warning-bold" size="20" style="color: #ef4444")
          .text-2xl.font-bold(style="color: #ef4444") {{ dashboardData.overdue }}
          .text-xs.mt-1(style="color: var(--text-muted)") Overdue
    //- Top Categories
    div(v-if="dashboardData.topCategories.length" class="mt-4")
      .text-xs.font-semibold.mb-2(style="color: var(--text-muted)") Top Categories
      .flex.flex-wrap.gap-2
        .inline-flex.items-center.gap-1.px-3.py-1.rounded-full(
          v-for="cat in dashboardData.topCategories"
          :key="cat.name"
          style="background: rgba(120, 73, 255, 0.1); border: 1px solid rgba(120, 73, 255, 0.2)"
        )
          span.text-xs.font-medium(style="color: #a78bfa") {{ cat.name }}
          span.text-xs.font-bold(style="color: var(--text-primary)") ({{ cat.count }})

  //- Stats Cards
  .grid.grid-cols-2.gap-4.mb-6(class="lg:grid-cols-4")
    .glass-card.p-5.rounded-2xl.text-center
      .text-2xl.font-bold(style="color: #7849ff") {{ programs.length }}
      .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.training.totalPrograms') || 'Total Programs' }}
    .glass-card.p-5.rounded-2xl.text-center
      .text-2xl.font-bold(style="color: #22c55e") {{ programs.filter(p => p.status === 'ACTIVE').length }}
      .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.training.activePrograms') || 'Active Programs' }}
    .glass-card.p-5.rounded-2xl.text-center
      .text-2xl.font-bold(style="color: #3b82f6") {{ enrollments.length }}
      .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.training.totalEnrollments') || 'Total Enrollments' }}
    .glass-card.p-5.rounded-2xl.text-center
      .text-2xl.font-bold(style="color: #f59e0b") {{ avgProgress }}%
      .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.training.avgProgress') || 'Avg Progress' }}

  //- Tabs
  el-tabs(v-model="activeTab")
    //- Programs Tab
    el-tab-pane(:label="$t('hr.training.programs') || 'Programs'" name="programs")
      //- Filters
      .flex.items-center.gap-3.mb-4
        el-input(v-model="programSearch" :placeholder="$t('common.search') || 'Search'" clearable style="width: 260px" size="large" class="!rounded-xl")
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")
        el-select(v-model="programStatusFilter" :placeholder="$t('hr.training.allStatuses') || 'All Statuses'" clearable size="large" style="width: 180px")
          el-option(label="All Statuses" value="")
          el-option(v-for="s in PROGRAM_STATUSES" :key="s.value" :label="s.label" :value="s.value")

      //- Programs Table
      .glass-card.rounded-2xl.overflow-hidden
        el-table(:data="filteredPrograms" v-loading="loading" style="width: 100%" stripe @row-click="navigateToProgram")
          el-table-column(:label="$t('hr.training.programTitle') || 'Title'" min-width="220")
            template(#default="{ row }")
              .flex.items-center.gap-3
                .w-9.h-9.rounded-xl.flex.items-center.justify-center.shrink-0(style="background: rgba(120, 73, 255, 0.15)")
                  Icon(name="ph:graduation-cap-bold" size="18" style="color: #7849ff")
                div
                  p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.title || '--' }}
                  p.text-xs(style="color: var(--text-muted)") {{ row.category || '' }}
          el-table-column(:label="$t('hr.training.type') || 'Type'" width="130")
            template(#default="{ row }")
              el-tag(effect="plain" size="small") {{ row.type || '--' }}
          el-table-column(:label="$t('hr.training.status') || 'Status'" width="130" align="center")
            template(#default="{ row }")
              el-tag(:type="getProgramStatusType(row.status)" effect="dark" size="small" round) {{ row.status }}
          el-table-column(:label="$t('hr.training.category') || 'Category'" min-width="140" prop="category")
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-primary)") {{ row.category || '--' }}
          el-table-column(:label="$t('hr.training.duration') || 'Duration (hrs)'" width="140" align="center")
            template(#default="{ row }")
              span.text-sm.font-bold(style="color: var(--text-primary)") {{ row.durationHours || 0 }}h
          el-table-column(:label="$t('hr.training.cost') || 'Cost'" width="120" align="center")
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-primary)") {{ row.cost ? `${row.cost} SAR` : '--' }}
          el-table-column(:label="$t('hr.training.instructor') || 'Instructor'" min-width="150" prop="instructor")
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-muted)") {{ row.instructor || '--' }}
          el-table-column(:label="$t('common.actions') || 'Actions'" width="120" align="center")
            template(#default="{ row }")
              .flex.items-center.justify-center.gap-1
                el-button(text type="primary" size="small" @click="openProgramDialog(row)")
                  Icon(name="ph:pencil-bold" size="16")
                el-button(text type="danger" size="small" @click="handleDeleteProgram(row)")
                  Icon(name="ph:trash-bold" size="16")

        .flex.justify-end.mt-4
          el-pagination(
            :current-page="programsPagination.page"
            :page-size="programsPagination.limit"
            :total="programsPagination.total"
            layout="total, prev, pager, next"
            @current-change="(p: number) => { programsPagination.page = p; loadData() }"
          )

    //- Enrollments Tab
    el-tab-pane(:label="$t('hr.training.enrollments') || 'Enrollments'" name="enrollments")
      //- Filters
      .flex.items-center.gap-3.mb-4
        el-input(v-model="enrollmentSearch" :placeholder="$t('common.search') || 'Search'" clearable style="width: 260px" size="large" class="!rounded-xl")
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")
        el-select(v-model="enrollmentStatusFilter" :placeholder="$t('hr.training.allStatuses') || 'All Statuses'" clearable size="large" style="width: 180px")
          el-option(label="All Statuses" value="")
          el-option(v-for="s in ENROLLMENT_STATUSES" :key="s.value" :label="s.label" :value="s.value")

      //- Enrollments Table
      .glass-card.rounded-2xl.overflow-hidden
        el-table(:data="filteredEnrollments" v-loading="loading" style="width: 100%" stripe)
          el-table-column(:label="$t('hr.training.employee') || 'Employee'" min-width="200")
            template(#default="{ row }")
              .flex.items-center.gap-3
                .w-9.h-9.rounded-full.flex.items-center.justify-center.shrink-0(style="background: rgba(120, 73, 255, 0.15)")
                  span.text-sm.font-bold(style="color: #7849ff") {{ (row.employeeName || '?').charAt(0).toUpperCase() }}
                div
                  p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.employeeName || '--' }}
          el-table-column(:label="$t('hr.training.program') || 'Program'" min-width="200" prop="programTitle")
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-primary)") {{ row.programTitle || '--' }}
          el-table-column(:label="$t('hr.training.status') || 'Status'" width="140" align="center")
            template(#default="{ row }")
              el-tag(:type="getEnrollmentStatusType(row.status)" effect="dark" size="small" round) {{ row.status }}
          el-table-column(:label="$t('hr.training.progress') || 'Progress'" width="180" align="center")
            template(#default="{ row }")
              .flex.items-center.gap-2
                el-progress(:percentage="row.progress || 0" :stroke-width="6" :color="getProgressColor(row.progress)" style="width: 100px")
                span.text-xs.font-semibold(style="color: var(--text-primary)") {{ row.progress || 0 }}%
          el-table-column(:label="$t('hr.training.score') || 'Score'" width="100" align="center")
            template(#default="{ row }")
              span.text-sm.font-bold(:style="{ color: row.score >= 80 ? '#22c55e' : row.score >= 60 ? '#f59e0b' : row.score > 0 ? '#ef4444' : 'var(--text-muted)' }") {{ row.score != null ? row.score : '--' }}
          el-table-column(:label="$t('common.actions') || 'Actions'" width="120" align="center")
            template(#default="{ row }")
              .flex.items-center.justify-center.gap-1
                el-button(text type="primary" size="small" @click="openEnrollmentDialog(row)")
                  Icon(name="ph:pencil-bold" size="16")
                el-button(text type="danger" size="small" @click="handleDeleteEnrollment(row)")
                  Icon(name="ph:trash-bold" size="16")

        .flex.justify-end.mt-4
          el-pagination(
            :current-page="enrollmentsPagination.page"
            :page-size="enrollmentsPagination.limit"
            :total="enrollmentsPagination.total"
            layout="total, prev, pager, next"
            @current-change="(p: number) => { enrollmentsPagination.page = p; loadData() }"
          )

  //- Program Dialog
  el-dialog(v-model="programDialogVisible" :title="editingProgram ? ($t('hr.training.editProgram') || 'Edit Program') : ($t('hr.training.newProgram') || 'New Program')" width="600px" destroy-on-close)
    el-form(:model="programForm" label-position="top")
      el-form-item(:label="$t('hr.training.programTitle') || 'Program Title'" required)
        el-input(v-model="programForm.title" :placeholder="$t('hr.training.titlePlaceholder') || 'e.g., Leadership Development Program'")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('hr.training.type') || 'Type'" required)
          el-select(v-model="programForm.type" class="w-full")
            el-option(label="Online" value="ONLINE")
            el-option(label="Classroom" value="CLASSROOM")
            el-option(label="Workshop" value="WORKSHOP")
            el-option(label="Webinar" value="WEBINAR")
            el-option(label="Self-paced" value="SELF_PACED")
            el-option(label="Blended" value="BLENDED")
        el-form-item(:label="$t('hr.training.status') || 'Status'")
          el-select(v-model="programForm.status" class="w-full")
            el-option(v-for="s in PROGRAM_STATUSES" :key="s.value" :label="s.label" :value="s.value")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('hr.training.category') || 'Category'")
          el-select(v-model="programForm.category" class="w-full" filterable allow-create :placeholder="$t('hr.training.selectCategory') || 'Select category'")
            el-option(v-for="cat in PROGRAM_CATEGORIES" :key="cat" :label="cat" :value="cat")
        el-form-item(:label="$t('hr.training.duration') || 'Duration (Hours)'")
          el-input-number(v-model="programForm.durationHours" :min="0" :max="1000" :step="0.5" class="w-full")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('hr.training.cost') || 'Cost (SAR)'")
          el-input-number(v-model="programForm.cost" :min="0" :step="100" class="w-full" :controls="false")
        el-form-item(:label="$t('hr.training.instructor') || 'Instructor'")
          el-input(v-model="programForm.instructor" :placeholder="$t('hr.training.instructorPlaceholder') || 'Enter instructor name'")
      el-form-item(:label="$t('hr.training.description') || 'Description'")
        el-input(v-model="programForm.description" type="textarea" :rows="3" :placeholder="$t('hr.training.descriptionPlaceholder') || 'Enter program description...'")
    template(#footer)
      el-button(@click="programDialogVisible = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" @click="handleSaveProgram" :loading="saving") {{ $t('common.save') || 'Save' }}

  //- Enrollment Dialog
  el-dialog(v-model="enrollmentDialogVisible" :title="editingEnrollment ? ($t('hr.training.editEnrollment') || 'Edit Enrollment') : ($t('hr.training.newEnrollment') || 'New Enrollment')" width="600px" destroy-on-close)
    el-form(:model="enrollmentForm" label-position="top")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('hr.training.employee') || 'Employee'" required)
          el-select(v-model="enrollmentForm.employeeId" filterable :placeholder="$t('hr.training.selectEmployee') || 'Select employee'" class="w-full")
            el-option(v-for="emp in employees" :key="emp.id" :label="emp.name" :value="emp.id")
        el-form-item(:label="$t('hr.training.program') || 'Program'" required)
          el-select(v-model="enrollmentForm.programId" filterable :placeholder="$t('hr.training.selectProgram') || 'Select program'" class="w-full")
            el-option(v-for="p in programs" :key="p.id" :label="p.title" :value="p.id")
      .grid.gap-4(class="grid-cols-3")
        el-form-item(:label="$t('hr.training.status') || 'Status'")
          el-select(v-model="enrollmentForm.status" class="w-full")
            el-option(v-for="s in ENROLLMENT_STATUSES" :key="s.value" :label="s.label" :value="s.value")
        el-form-item(:label="$t('hr.training.progress') || 'Progress (%)'")
          el-slider(v-model="enrollmentForm.progress" :min="0" :max="100" :step="5" show-input :show-input-controls="false" input-size="small")
        el-form-item(:label="$t('hr.training.score') || 'Score'")
          el-input-number(v-model="enrollmentForm.score" :min="0" :max="100" class="w-full")
    template(#footer)
      el-button(@click="enrollmentDialogVisible = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" @click="handleSaveEnrollment" :loading="saving") {{ $t('common.save') || 'Save' }}
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { ElNotification, ElMessageBox } from 'element-plus';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;
const router = useRouter();

const loading = ref(false);
const saving = ref(false);
const activeTab = ref('programs');

// Programs state
const programDialogVisible = ref(false);
const editingProgram = ref<any>(null);
const programSearch = ref('');
const programStatusFilter = ref('');
const programs = ref<any[]>([]);
const programsPagination = reactive({ page: 1, limit: 20, total: 0 });

// Enrollments state
const enrollmentDialogVisible = ref(false);
const editingEnrollment = ref<any>(null);
const enrollmentSearch = ref('');
const enrollmentStatusFilter = ref('');
const enrollments = ref<any[]>([]);
const enrollmentsPagination = reactive({ page: 1, limit: 20, total: 0 });

// Employees for enrollment select
const employees = ref<any[]>([]);

// Dashboard state
const dashboardLoading = ref(false);
const dashboardData = reactive({
  totalPrograms: 0,
  activeEnrollments: 0,
  completionRate: 0,
  upcoming: 0,
  overdue: 0,
  topCategories: [] as Array<{ name: string; count: number }>
});

const PROGRAM_STATUSES = [
  { value: 'ACTIVE', label: 'Active', type: 'success' },
  { value: 'DRAFT', label: 'Draft', type: 'info' },
  { value: 'ARCHIVED', label: 'Archived', type: '' },
  { value: 'CANCELLED', label: 'Cancelled', type: 'danger' }
];

const ENROLLMENT_STATUSES = [
  { value: 'ENROLLED', label: 'Enrolled', type: '' },
  { value: 'IN_PROGRESS', label: 'In Progress', type: 'warning' },
  { value: 'COMPLETED', label: 'Completed', type: 'success' },
  { value: 'DROPPED', label: 'Dropped', type: 'danger' },
  { value: 'FAILED', label: 'Failed', type: 'danger' }
];

const PROGRAM_CATEGORIES = [
  'Sales', 'Marketing', 'Technical', 'Leadership', 'Compliance',
  'Onboarding', 'Soft Skills', 'Safety', 'Product', 'Management'
];

// Forms
const programForm = reactive({
  title: '',
  type: 'ONLINE',
  status: 'ACTIVE',
  category: '',
  durationHours: 0,
  cost: 0,
  instructor: '',
  description: ''
});

const enrollmentForm = reactive({
  employeeId: '' as string | number,
  programId: '' as string | number,
  status: 'ENROLLED',
  progress: 0,
  score: 0
});

// Computed
const avgProgress = computed(() => {
  if (!enrollments.value.length) return 0;
  return Math.round(enrollments.value.reduce((sum: number, e: any) => sum + (e.progress || 0), 0) / enrollments.value.length);
});

const filteredPrograms = computed(() => {
  let data = programs.value;
  if (programStatusFilter.value) {
    data = data.filter(p => p.status === programStatusFilter.value);
  }
  if (programSearch.value) {
    const q = programSearch.value.toLowerCase();
    data = data.filter(p =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.instructor || '').toLowerCase().includes(q)
    );
  }
  return data;
});

const filteredEnrollments = computed(() => {
  let data = enrollments.value;
  if (enrollmentStatusFilter.value) {
    data = data.filter(e => e.status === enrollmentStatusFilter.value);
  }
  if (enrollmentSearch.value) {
    const q = enrollmentSearch.value.toLowerCase();
    data = data.filter(e =>
      (e.employeeName || '').toLowerCase().includes(q) ||
      (e.programTitle || '').toLowerCase().includes(q)
    );
  }
  return data;
});

// Helpers
function getProgramStatusType(status: string): string {
  const map: Record<string, string> = { ACTIVE: 'success', DRAFT: 'info', ARCHIVED: '', CANCELLED: 'danger' };
  return map[status] || 'info';
}

function getEnrollmentStatusType(status: string): string {
  const map: Record<string, string> = { ENROLLED: '', IN_PROGRESS: 'warning', COMPLETED: 'success', DROPPED: 'danger', FAILED: 'danger' };
  return map[status] || 'info';
}

function getProgressColor(progress: number): string {
  if (progress >= 80) return '#22c55e';
  if (progress >= 50) return '#f59e0b';
  return '#3b82f6';
}

function navigateToProgram(row: any) {
  if (row?.id) router.push(`/hr/training/${row.id}`);
}

// Program CRUD
function resetProgramForm() {
  programForm.title = '';
  programForm.type = 'ONLINE';
  programForm.status = 'ACTIVE';
  programForm.category = '';
  programForm.durationHours = 0;
  programForm.cost = 0;
  programForm.instructor = '';
  programForm.description = '';
}

function openProgramDialog(item?: any) {
  if (item?.id) {
    editingProgram.value = item;
    programForm.title = item.title || '';
    programForm.type = item.type || 'ONLINE';
    programForm.status = item.status || 'ACTIVE';
    programForm.category = item.category || '';
    programForm.durationHours = item.durationHours || 0;
    programForm.cost = item.cost || 0;
    programForm.instructor = item.instructor || '';
    programForm.description = item.description || '';
  } else {
    editingProgram.value = null;
    resetProgramForm();
  }
  programDialogVisible.value = true;
}

async function handleSaveProgram() {
  if (!programForm.title || !programForm.type) {
    ElNotification({ type: 'warning', title: t('common.warning') || 'Warning', message: t('common.fillRequired') || 'Please fill all required fields' });
    return;
  }
  saving.value = true;
  try {
    const payload = { ...programForm };
    if (editingProgram.value) {
      await useApiFetch(`hr/training/programs/${editingProgram.value.id}`, 'PUT', payload);
    } else {
      await useApiFetch('hr/training/programs', 'POST', payload);
    }
    await loadData();
    programDialogVisible.value = false;
    ElNotification({ type: 'success', title: t('common.success') || 'Success', message: t('common.saved') || 'Saved successfully' });
  } catch {
    ElNotification({ type: 'error', title: t('common.error') || 'Error', message: t('common.error') || 'An error occurred' });
  } finally {
    saving.value = false;
  }
}

async function handleDeleteProgram(row: any) {
  try {
    await ElMessageBox.confirm(
      t('common.confirmDelete') || 'Are you sure you want to delete this program?',
      t('common.warning') || 'Warning',
      { type: 'warning' }
    );
    loading.value = true;
    await useApiFetch(`hr/training/programs/${row.id}`, 'DELETE');
    await loadData();
    ElNotification({ type: 'success', title: t('common.success') || 'Success', message: t('common.deleted') || 'Deleted successfully' });
  } catch {
    // User cancelled or error
  } finally {
    loading.value = false;
  }
}

// Enrollment CRUD
function resetEnrollmentForm() {
  enrollmentForm.employeeId = '';
  enrollmentForm.programId = '';
  enrollmentForm.status = 'ENROLLED';
  enrollmentForm.progress = 0;
  enrollmentForm.score = 0;
}

function openEnrollmentDialog(item?: any) {
  if (item?.id) {
    editingEnrollment.value = item;
    enrollmentForm.employeeId = item.employeeId || '';
    enrollmentForm.programId = item.programId || '';
    enrollmentForm.status = item.status || 'ENROLLED';
    enrollmentForm.progress = item.progress || 0;
    enrollmentForm.score = item.score || 0;
  } else {
    editingEnrollment.value = null;
    resetEnrollmentForm();
  }
  enrollmentDialogVisible.value = true;
}

async function handleSaveEnrollment() {
  if (!enrollmentForm.employeeId || !enrollmentForm.programId) {
    ElNotification({ type: 'warning', title: t('common.warning') || 'Warning', message: t('common.fillRequired') || 'Please fill all required fields' });
    return;
  }
  saving.value = true;
  try {
    const payload = { ...enrollmentForm };
    if (editingEnrollment.value) {
      await useApiFetch(`hr/training/enrollments/${editingEnrollment.value.id}`, 'PUT', payload);
    } else {
      await useApiFetch('hr/training/enrollments', 'POST', payload);
    }
    await loadData();
    enrollmentDialogVisible.value = false;
    ElNotification({ type: 'success', title: t('common.success') || 'Success', message: t('common.saved') || 'Saved successfully' });
  } catch {
    ElNotification({ type: 'error', title: t('common.error') || 'Error', message: t('common.error') || 'An error occurred' });
  } finally {
    saving.value = false;
  }
}

async function handleDeleteEnrollment(row: any) {
  try {
    await ElMessageBox.confirm(
      t('common.confirmDelete') || 'Are you sure you want to delete this enrollment?',
      t('common.warning') || 'Warning',
      { type: 'warning' }
    );
    loading.value = true;
    await useApiFetch(`hr/training/enrollments/${row.id}`, 'DELETE');
    await loadData();
    ElNotification({ type: 'success', title: t('common.success') || 'Success', message: t('common.deleted') || 'Deleted successfully' });
  } catch {
    // User cancelled or error
  } finally {
    loading.value = false;
  }
}

// Load all data
async function loadData() {
  loading.value = true;
  try {
    const [programsRes, enrollmentsRes, empRes] = await Promise.all([
      useApiFetch(`hr/training/programs?page=${programsPagination.page}&limit=${programsPagination.limit}`),
      useApiFetch(`hr/training/enrollments?page=${enrollmentsPagination.page}&limit=${enrollmentsPagination.limit}`),
      useApiFetch('hr/employees?limit=500')
    ]);
    if (programsRes?.success && programsRes.body) {
      const data = programsRes.body as any;
      programs.value = data.rows || data.docs || data || [];
      programsPagination.total = data.count ?? data.total ?? programs.value.length;
    }
    if (enrollmentsRes?.success && enrollmentsRes.body) {
      const data = enrollmentsRes.body as any;
      enrollments.value = data.rows || data.docs || data || [];
      enrollmentsPagination.total = data.count ?? data.total ?? enrollments.value.length;
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

// Training Dashboard fetch
async function loadDashboard() {
  dashboardLoading.value = true;
  try {
    const res = await useApiFetch('hr/training/dashboard');
    if (res?.success && res.body) {
      const d = res.body as any;
      dashboardData.totalPrograms = d.totalPrograms ?? 0;
      dashboardData.activeEnrollments = d.activeEnrollments ?? 0;
      dashboardData.completionRate = d.completionRate ?? 0;
      dashboardData.upcoming = d.upcoming ?? d.upcomingPrograms ?? 0;
      dashboardData.overdue = d.overdue ?? 0;
      dashboardData.topCategories = (d.topCategories || []).map((c: any) => ({
        name: c.name || c.category || '--',
        count: c.count ?? 0
      }));
    }
  } catch {
    // Dashboard data is supplementary; silently ignore errors
  } finally {
    dashboardLoading.value = false;
  }
}

onMounted(() => {
  loadData();
  loadDashboard();
});
</script>

<style lang="scss" scoped>
.glass-card {
  background: var(--bg-elevated, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--border-default, rgba(255, 255, 255, 0.08));
  border-radius: 16px;
}
</style>
