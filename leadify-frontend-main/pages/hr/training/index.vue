<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-8
    div
      .title.font-bold.text-2xl.mb-1(style="color: var(--text-primary)") {{ $t('hr.training.title') }}
      p.text-sm(style="color: var(--text-muted)") {{ $t('hr.training.subtitle') }}
    .flex.items-center.gap-x-3
      el-button(v-if="activeTab === 'programs'" size="large" type="primary" @click="openProgramDialog()" class="!rounded-2xl")
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('hr.training.newProgram') }}
      el-button(v-if="activeTab === 'enrollments'" size="large" type="primary" @click="openEnrollmentDialog()" class="!rounded-2xl")
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('hr.training.newEnrollment') }}

  //- Training Dashboard
  .glass-card.p-6.rounded-2xl.mb-6(v-loading="dashboardLoading")
    .flex.items-center.gap-2.mb-4
      Icon(name="ph:chart-pie-slice-bold" size="20" style="color: #7849ff")
      span.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('hr.training.trainingDashboard') }}
    el-row(:gutter="16")
      el-col(:xs="12" :sm="8" :md="4")
        .glass-card.p-4.rounded-xl.text-center
          .flex.items-center.justify-center.mb-2
            Icon(name="ph:graduation-cap-bold" size="20" style="color: #7849ff")
          .text-2xl.font-bold(style="color: #7849ff") {{ dashboardData.totalPrograms }}
          .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.training.totalPrograms') }}
      el-col(:xs="12" :sm="8" :md="4")
        .glass-card.p-4.rounded-xl.text-center
          .flex.items-center.justify-center.mb-2
            Icon(name="ph:users-bold" size="20" style="color: #3b82f6")
          .text-2xl.font-bold(style="color: #3b82f6") {{ dashboardData.activeEnrollments }}
          .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.training.activeEnrollments') }}
      el-col(:xs="12" :sm="8" :md="4")
        .glass-card.p-4.rounded-xl.text-center
          .flex.items-center.justify-center.mb-2
            Icon(name="ph:check-circle-bold" size="20" style="color: #22c55e")
          .text-2xl.font-bold(style="color: #22c55e") {{ dashboardData.completionRate }}%
          .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.training.completionRate') }}
      el-col(:xs="12" :sm="8" :md="4")
        .glass-card.p-4.rounded-xl.text-center
          .flex.items-center.justify-center.mb-2
            Icon(name="ph:calendar-bold" size="20" style="color: #f59e0b")
          .text-2xl.font-bold(style="color: #f59e0b") {{ dashboardData.upcoming }}
          .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.training.upcomingPrograms') }}
      el-col(:xs="24" :sm="8" :md="4")
        .glass-card.p-4.rounded-xl.text-center
          .flex.items-center.justify-center.mb-2
            Icon(name="ph:warning-bold" size="20" style="color: #ef4444")
          .text-2xl.font-bold(style="color: #ef4444") {{ dashboardData.overdue }}
          .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.training.overdue') }}
    //- Top Categories
    div(v-if="dashboardData.topCategories.length" class="mt-4")
      .text-xs.font-semibold.mb-2(style="color: var(--text-muted)") {{ $t('hr.training.topCategories') }}
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
      .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.training.totalPrograms') }}
    .glass-card.p-5.rounded-2xl.text-center
      .text-2xl.font-bold(style="color: #22c55e") {{ programs.filter(p => p.status === 'ACTIVE').length }}
      .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.training.activePrograms') }}
    .glass-card.p-5.rounded-2xl.text-center
      .text-2xl.font-bold(style="color: #3b82f6") {{ enrollments.length }}
      .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.training.totalEnrollments') }}
    .glass-card.p-5.rounded-2xl.text-center
      .text-2xl.font-bold(style="color: #f59e0b") {{ avgProgress }}%
      .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.training.avgProgress') }}

  //- Tabs
  el-tabs(v-model="activeTab")
    //- Programs Tab
    el-tab-pane(:label="$t('hr.training.programs')" name="programs")
      //- Filters
      .flex.items-center.gap-3.mb-4
        el-input(v-model="programSearch" :placeholder="$t('common.search')" clearable style="width: 260px" size="large" class="!rounded-xl")
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")
        el-select(v-model="programStatusFilter" :placeholder="$t('hr.training.allStatuses')" clearable size="large" style="width: 180px")
          el-option(:label="$t('hr.training.allStatuses')" value="")
          el-option(v-for="s in PROGRAM_STATUSES" :key="s.value" :label="s.label" :value="s.value")

      //- Programs Table
      .glass-card.rounded-2xl.overflow-hidden
        el-table(:data="filteredPrograms" v-loading="loading" style="width: 100%" stripe @row-click="navigateToProgram")
          el-table-column(:label="$t('hr.training.programTitle')" min-width="220")
            template(#default="{ row }")
              .flex.items-center.gap-3
                .w-9.h-9.rounded-xl.flex.items-center.justify-center.shrink-0(style="background: rgba(120, 73, 255, 0.15)")
                  Icon(name="ph:graduation-cap-bold" size="18" style="color: #7849ff")
                div
                  p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.title || '--' }}
                  p.text-xs(style="color: var(--text-muted)") {{ row.category || '' }}
          el-table-column(:label="$t('hr.training.type')" width="130")
            template(#default="{ row }")
              el-tag(effect="plain" size="small") {{ row.type ? getProgramTypeLabel(row.type) : '--' }}
          el-table-column(:label="$t('hr.training.status')" width="130" align="center")
            template(#default="{ row }")
              el-tag(:type="getProgramStatusType(row.status)" effect="dark" size="small" round) {{ getProgramStatusLabel(row.status) }}
          el-table-column(:label="$t('hr.training.category')" min-width="140" prop="category")
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-primary)") {{ row.category || '--' }}
          el-table-column(:label="$t('hr.training.duration')" width="140" align="center")
            template(#default="{ row }")
              span.text-sm.font-bold(style="color: var(--text-primary)") {{ row.durationHours || 0 }}h
          el-table-column(:label="$t('hr.training.cost')" width="120" align="center")
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-primary)") {{ row.cost ? `${row.cost} SAR` : '--' }}
          el-table-column(:label="$t('hr.training.instructor')" min-width="150" prop="instructor")
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-muted)") {{ row.instructor || '--' }}
          el-table-column(:label="$t('common.actions')" width="120" align="center")
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
    el-tab-pane(:label="$t('hr.training.enrollments')" name="enrollments")
      //- Filters
      .flex.items-center.gap-3.mb-4
        el-input(v-model="enrollmentSearch" :placeholder="$t('common.search')" clearable style="width: 260px" size="large" class="!rounded-xl")
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")
        el-select(v-model="enrollmentStatusFilter" :placeholder="$t('hr.training.allStatuses')" clearable size="large" style="width: 180px")
          el-option(:label="$t('hr.training.allStatuses')" value="")
          el-option(v-for="s in ENROLLMENT_STATUSES" :key="s.value" :label="s.label" :value="s.value")

      //- Enrollments Table
      .glass-card.rounded-2xl.overflow-hidden
        el-table(:data="filteredEnrollments" v-loading="loading" style="width: 100%" stripe)
          el-table-column(:label="$t('hr.training.employee')" min-width="200")
            template(#default="{ row }")
              .flex.items-center.gap-3
                .w-9.h-9.rounded-full.flex.items-center.justify-center.shrink-0(style="background: rgba(120, 73, 255, 0.15)")
                  span.text-sm.font-bold(style="color: #7849ff") {{ (row.employeeName || '?').charAt(0).toUpperCase() }}
                div
                  p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.employeeName || '--' }}
          el-table-column(:label="$t('hr.training.program')" min-width="200" prop="programTitle")
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-primary)") {{ row.programTitle || '--' }}
          el-table-column(:label="$t('hr.training.status')" width="140" align="center")
            template(#default="{ row }")
              el-tag(:type="getEnrollmentStatusType(row.status)" effect="dark" size="small" round) {{ getEnrollmentStatusLabel(row.status) }}
          el-table-column(:label="$t('hr.training.progress')" width="180" align="center")
            template(#default="{ row }")
              .flex.items-center.gap-2
                el-progress(:percentage="row.progress || 0" :stroke-width="6" :color="getProgressColor(row.progress)" style="width: 100px")
                span.text-xs.font-semibold(style="color: var(--text-primary)") {{ row.progress || 0 }}%
          el-table-column(:label="$t('hr.training.score')" width="100" align="center")
            template(#default="{ row }")
              span.text-sm.font-bold(:style="{ color: row.score >= 80 ? '#22c55e' : row.score >= 60 ? '#f59e0b' : row.score > 0 ? '#ef4444' : 'var(--text-muted)' }") {{ row.score != null ? row.score : '--' }}
          el-table-column(:label="$t('common.actions')" width="120" align="center")
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
  el-dialog(v-model="programDialogVisible" :title="editingProgram ? $t('hr.training.editProgram') : $t('hr.training.newProgram')" width="600px" destroy-on-close)
    el-form(:model="programForm" label-position="top")
      el-form-item(:label="$t('hr.training.programTitle')" required)
        el-input(v-model="programForm.title" :placeholder="$t('hr.training.titlePlaceholder')")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('hr.training.type')" required)
          el-select(v-model="programForm.type" class="w-full")
            el-option(:label="$t('hr.training.typeOnline')" value="ONLINE")
            el-option(:label="$t('hr.training.typeClassroom')" value="CLASSROOM")
            el-option(:label="$t('hr.training.typeWorkshop')" value="WORKSHOP")
            el-option(:label="$t('hr.training.typeWebinar')" value="WEBINAR")
            el-option(:label="$t('hr.training.typeSelfPaced')" value="SELF_PACED")
            el-option(:label="$t('hr.training.typeBlended')" value="BLENDED")
        el-form-item(:label="$t('hr.training.status')")
          el-select(v-model="programForm.status" class="w-full")
            el-option(v-for="s in PROGRAM_STATUSES" :key="s.value" :label="s.label" :value="s.value")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('hr.training.category')")
          el-select(v-model="programForm.category" class="w-full" filterable allow-create :placeholder="$t('hr.training.selectCategory')")
            el-option(v-for="cat in PROGRAM_CATEGORIES" :key="cat.value" :label="cat.label" :value="cat.value")
        el-form-item(:label="$t('hr.training.duration')")
          el-input-number(v-model="programForm.durationHours" :min="0" :max="1000" :step="0.5" class="w-full")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('hr.training.cost')")
          el-input-number(v-model="programForm.cost" :min="0" :step="100" class="w-full" :controls="false")
        el-form-item(:label="$t('hr.training.instructor')")
          el-input(v-model="programForm.instructor" :placeholder="$t('hr.training.instructorPlaceholder')")
      el-form-item(:label="$t('hr.training.description')")
        el-input(v-model="programForm.description" type="textarea" :rows="3" :placeholder="$t('hr.training.descriptionPlaceholder')")
    template(#footer)
      el-button(@click="programDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleSaveProgram" :loading="saving") {{ $t('common.save') }}

  //- Enrollment Dialog
  el-dialog(v-model="enrollmentDialogVisible" :title="editingEnrollment ? $t('hr.training.editEnrollment') : $t('hr.training.newEnrollment')" width="600px" destroy-on-close)
    el-form(:model="enrollmentForm" label-position="top")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('hr.training.employee')" required)
          el-select(v-model="enrollmentForm.employeeId" filterable :placeholder="$t('hr.training.selectEmployee')" class="w-full")
            el-option(v-for="emp in employees" :key="emp.id" :label="emp.name" :value="emp.id")
        el-form-item(:label="$t('hr.training.program')" required)
          el-select(v-model="enrollmentForm.programId" filterable :placeholder="$t('hr.training.selectProgram')" class="w-full")
            el-option(v-for="p in programs" :key="p.id" :label="p.title" :value="p.id")
      .grid.gap-4(class="grid-cols-3")
        el-form-item(:label="$t('hr.training.status')")
          el-select(v-model="enrollmentForm.status" class="w-full")
            el-option(v-for="s in ENROLLMENT_STATUSES" :key="s.value" :label="s.label" :value="s.value")
        el-form-item(:label="$t('hr.training.progress')")
          el-slider(v-model="enrollmentForm.progress" :min="0" :max="100" :step="5" show-input :show-input-controls="false" input-size="small")
        el-form-item(:label="$t('hr.training.score')")
          el-input-number(v-model="enrollmentForm.score" :min="0" :max="100" class="w-full")
    template(#footer)
      el-button(@click="enrollmentDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleSaveEnrollment" :loading="saving") {{ $t('common.save') }}
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
const editingProgram = ref<Record<string, unknown> | null>(null);
const programSearch = ref('');
const programStatusFilter = ref('');
const programs = ref<Record<string, unknown>[]>([]);
const programsPagination = reactive({ page: 1, limit: 20, total: 0 });

// Enrollments state
const enrollmentDialogVisible = ref(false);
const editingEnrollment = ref<Record<string, unknown> | null>(null);
const enrollmentSearch = ref('');
const enrollmentStatusFilter = ref('');
const enrollments = ref<Record<string, unknown>[]>([]);
const enrollmentsPagination = reactive({ page: 1, limit: 20, total: 0 });

// Employees for enrollment select
const employees = ref<Record<string, unknown>[]>([]);

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

const PROGRAM_STATUSES = computed(() => [
  { value: 'ACTIVE', label: t('hr.training.statusActive'), type: 'success' },
  { value: 'DRAFT', label: t('hr.training.statusDraft'), type: 'info' },
  { value: 'ARCHIVED', label: t('hr.training.statusArchived'), type: '' },
  { value: 'CANCELLED', label: t('hr.training.statusCancelled'), type: 'danger' }
]);

const ENROLLMENT_STATUSES = computed(() => [
  { value: 'ENROLLED', label: t('hr.training.enrollmentStatusEnrolled'), type: '' },
  { value: 'IN_PROGRESS', label: t('hr.training.enrollmentStatusInProgress'), type: 'warning' },
  { value: 'COMPLETED', label: t('hr.training.enrollmentStatusCompleted'), type: 'success' },
  { value: 'DROPPED', label: t('hr.training.enrollmentStatusDropped'), type: 'danger' },
  { value: 'FAILED', label: t('hr.training.enrollmentStatusFailed'), type: 'danger' }
]);

const PROGRAM_CATEGORIES = computed(() => [
  { value: 'Sales', label: t('hr.training.categorySales') },
  { value: 'Marketing', label: t('hr.training.categoryMarketing') },
  { value: 'Technical', label: t('hr.training.categoryTechnical') },
  { value: 'Leadership', label: t('hr.training.categoryLeadership') },
  { value: 'Compliance', label: t('hr.training.categoryCompliance') },
  { value: 'Onboarding', label: t('hr.training.categoryOnboarding') },
  { value: 'Soft Skills', label: t('hr.training.categorySoftSkills') },
  { value: 'Safety', label: t('hr.training.categorySafety') },
  { value: 'Product', label: t('hr.training.categoryProduct') },
  { value: 'Management', label: t('hr.training.categoryManagement') }
]);

function getProgramStatusLabel(status: string): string {
  const found = PROGRAM_STATUSES.value.find(s => s.value === status);
  return found ? found.label : status;
}

function getProgramTypeLabel(type: string): string {
  const map: Record<string, string> = {
    ONLINE: t('hr.training.typeOnline'),
    CLASSROOM: t('hr.training.typeClassroom'),
    WORKSHOP: t('hr.training.typeWorkshop'),
    WEBINAR: t('hr.training.typeWebinar'),
    SELF_PACED: t('hr.training.typeSelfPaced'),
    BLENDED: t('hr.training.typeBlended')
  };
  return map[type] || type;
}

function getEnrollmentStatusLabel(status: string): string {
  const found = ENROLLMENT_STATUSES.value.find(s => s.value === status);
  return found ? found.label : status;
}

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
  return Math.round(enrollments.value.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.value.length);
});

const filteredPrograms = computed(() => {
  let data = programs.value;
  if (programStatusFilter.value) {
    data = data.filter(p => p.status === programStatusFilter.value);
  }
  if (programSearch.value) {
    const q = programSearch.value.toLowerCase();
    data = data.filter(
      p => (p.title || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q) || (p.instructor || '').toLowerCase().includes(q)
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
    data = data.filter(e => (e.employeeName || '').toLowerCase().includes(q) || (e.programTitle || '').toLowerCase().includes(q));
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

function navigateToProgram(row: unknown) {
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

function openProgramDialog(item?: unknown) {
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
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
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
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

async function handleDeleteProgram(row: unknown) {
  try {
    await ElMessageBox.confirm(t('common.confirmDelete'), t('common.warning'), { type: 'warning' });
    loading.value = true;
    await useApiFetch(`hr/training/programs/${row.id}`, 'DELETE');
    await loadData();
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
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

function openEnrollmentDialog(item?: unknown) {
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
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
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
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

async function handleDeleteEnrollment(row: unknown) {
  try {
    await ElMessageBox.confirm(t('common.confirmDelete'), t('common.warning'), { type: 'warning' });
    loading.value = true;
    await useApiFetch(`hr/training/enrollments/${row.id}`, 'DELETE');
    await loadData();
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
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
      const data = programsRes.body as unknown;
      programs.value = data.rows || data.docs || data || [];
      programsPagination.total = data.count ?? data.total ?? programs.value.length;
    }
    if (enrollmentsRes?.success && enrollmentsRes.body) {
      const data = enrollmentsRes.body as unknown;
      enrollments.value = data.rows || data.docs || data || [];
      enrollmentsPagination.total = data.count ?? data.total ?? enrollments.value.length;
    }
    if (empRes?.success && empRes.body) {
      const data = empRes.body as unknown;
      const docs = data.docs || data || [];
      employees.value = docs.map(e => ({
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
      const d = res.body as unknown;
      dashboardData.totalPrograms = d.totalPrograms ?? 0;
      dashboardData.activeEnrollments = d.activeEnrollments ?? 0;
      dashboardData.completionRate = d.completionRate ?? 0;
      dashboardData.upcoming = d.upcoming ?? d.upcomingPrograms ?? 0;
      dashboardData.overdue = d.overdue ?? 0;
      dashboardData.topCategories = (d.topCategories || []).map(c => ({
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
