<template lang="pug">
div
  //- Breadcrumb Header
  .flex.items-center.justify-between.mb-8
    div
      .flex.items-center.gap-2.mb-2
        NuxtLink.text-sm.font-medium(to="/hr/training" style="color: var(--accent-color, #7849ff)") {{ $t('hr.training.title') }}
        Icon(name="ph:caret-right" size="14" style="color: var(--text-muted)")
        span.text-sm(style="color: var(--text-muted)") {{ program?.title || '...' }}
      h1.text-2xl.font-bold(style="color: var(--text-primary)") {{ program?.title || $t('hr.training.programDetail') }}
      p.text-sm.mt-1(v-if="program" style="color: var(--text-muted)")
        | {{ program.type }} | {{ program.category || '--' }} | {{ program.instructor || $t('hr.training.noInstructor') }}
    .flex.items-center.gap-3
      el-button(size="large" type="primary" @click="openEnrollDialog()" class="!rounded-2xl")
        Icon(name="ph:user-plus-bold" size="16")
        span.ml-1 {{ $t('hr.training.enrollParticipant') }}
      el-button(size="large" plain @click="openEditDialog()" class="!rounded-2xl")
        Icon(name="ph:pencil-bold" size="16")
        span.ml-1 {{ $t('common.edit') }}

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  template(v-else-if="program")
    //- Program Info Card
    .glass-card.p-6.rounded-2xl.mb-6
      .grid.gap-6(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-5")
        div
          p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('hr.training.status') }}
          el-tag(:type="getStatusType(program.status)" effect="dark" size="default") {{ program.status }}
        div
          p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('hr.training.type') }}
          el-tag(effect="plain" size="default") {{ program.type }}
        div
          p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('hr.training.duration') }}
          p.text-lg.font-bold(style="color: var(--text-primary)") {{ program.durationHours || 0 }}h
        div
          p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('hr.training.dateRange') }}
          p.text-sm.font-semibold(style="color: var(--text-primary)") {{ formatDate(program.startDate) }} - {{ formatDate(program.endDate) }}
        div
          p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('hr.training.capacity') }}
          p.text-lg.font-bold(style="color: var(--text-primary)") {{ enrollments.length }}/{{ program.maxParticipants || '--' }}

      //- Description
      div.mt-5(v-if="program.description")
        p.text-xs.uppercase.tracking-wider.mb-2(style="color: var(--text-muted)") {{ $t('hr.training.description') }}
        p.text-sm(style="color: var(--text-primary); line-height: 1.7; white-space: pre-line") {{ program.description }}

    //- Completion Stats + Materials Row
    el-row(:gutter="16" class="mb-6")
      //- Completion Stats
      el-col(:xs="24" :md="12")
        .glass-card.p-6.rounded-2xl.h-full
          .flex.items-center.gap-2.mb-4
            Icon(name="ph:chart-pie-slice-bold" size="20" style="color: #7849ff")
            h3.text-base.font-bold(style="color: var(--text-primary)") {{ $t('hr.training.completionStats') }}

          .grid.gap-4(class="grid-cols-2 lg:grid-cols-4")
            .text-center
              .text-2xl.font-bold(style="color: #3b82f6") {{ statusCounts.enrolled }}
              .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.training.enrolled') }}
            .text-center
              .text-2xl.font-bold(style="color: #f59e0b") {{ statusCounts.inProgress }}
              .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.training.inProgress') }}
            .text-center
              .text-2xl.font-bold(style="color: #22c55e") {{ statusCounts.completed }}
              .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.training.completed') }}
            .text-center
              .text-2xl.font-bold(style="color: #ef4444") {{ statusCounts.dropped }}
              .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.training.dropped') }}

          //- Completion rate bar
          .mt-4
            .flex.items-center.justify-between.mb-2
              span.text-sm.font-medium(style="color: var(--text-primary)") {{ $t('hr.training.completionRate') }}
              span.text-sm.font-bold(:style="{ color: completionRate >= 70 ? '#22c55e' : completionRate >= 40 ? '#f59e0b' : '#ef4444' }") {{ completionRate }}%
            el-progress(:percentage="completionRate" :stroke-width="10" :color="completionRate >= 70 ? '#22c55e' : completionRate >= 40 ? '#f59e0b' : '#ef4444'" :show-text="false")

      //- Materials Section
      el-col(:xs="24" :md="12")
        .glass-card.p-6.rounded-2xl.h-full
          .flex.items-center.justify-between.mb-4
            .flex.items-center.gap-2
              Icon(name="ph:files-bold" size="20" style="color: #3b82f6")
              h3.text-base.font-bold(style="color: var(--text-primary)") {{ $t('hr.training.materials') }}
            el-button(text type="primary" size="small" @click="showAddMaterial = true")
              Icon(name="ph:plus-bold" size="14")
              span.ml-1 {{ $t('common.add') }}

          .space-y-3(v-if="program.materials?.length")
            .flex.items-center.gap-3.p-3.rounded-xl(
              v-for="(mat, idx) in program.materials"
              :key="idx"
              style="background: var(--bg-surface, rgba(255,255,255,0.03))"
            )
              .w-9.h-9.rounded-xl.flex.items-center.justify-center.shrink-0(:style="{ background: getMaterialBg(mat.type) }")
                Icon(:name="getMaterialIcon(mat.type)" size="18" :style="{ color: getMaterialColor(mat.type) }")
              .flex-1.min-w-0
                p.text-sm.font-semibold.truncate(style="color: var(--text-primary)") {{ mat.name }}
                p.text-xs(style="color: var(--text-muted)") {{ mat.type || 'Document' }}
              a.shrink-0(v-if="mat.url" :href="mat.url" target="_blank")
                el-button(text type="primary" size="small")
                  Icon(name="ph:download-bold" size="16")

          .text-center.py-6(v-else)
            Icon(name="ph:folder-open" size="40" style="color: var(--text-muted)")
            p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('hr.training.noMaterials') }}

    //- Participants Table
    .glass-card.p-6.rounded-2xl
      .flex.items-center.justify-between.mb-4
        .flex.items-center.gap-2
          Icon(name="ph:users-bold" size="20" style="color: #7849ff")
          h3.text-base.font-bold(style="color: var(--text-primary)") {{ $t('hr.training.participants') }} ({{ enrollments.length }})
        .flex.items-center.gap-2
          el-select(v-model="participantStatusFilter" clearable :placeholder="$t('common.status')" size="default" style="width: 140px")
            el-option(label="All" value="")
            el-option(v-for="s in ENROLLMENT_STATUSES" :key="s.value" :label="s.label" :value="s.value")

      el-table(:data="filteredParticipants" v-loading="loading" style="width: 100%" stripe)
        el-table-column(:label="$t('hr.training.employee')" min-width="200")
          template(#default="{ row }")
            .flex.items-center.gap-3
              .w-9.h-9.rounded-full.flex.items-center.justify-center.shrink-0(style="background: rgba(120, 73, 255, 0.15)")
                span.text-sm.font-bold(style="color: #7849ff") {{ getInitial(row) }}
              div
                p.text-sm.font-semibold(style="color: var(--text-primary)") {{ getEmployeeName(row) }}
                p.text-xs(v-if="row.employee?.jobTitle" style="color: var(--text-muted)") {{ row.employee.jobTitle }}
        el-table-column(:label="$t('hr.training.enrolledDate')" width="140")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-muted)") {{ formatDate(row.createdAt) }}
        el-table-column(:label="$t('hr.training.progress')" width="200" align="center")
          template(#default="{ row }")
            .flex.items-center.gap-2
              el-progress(:percentage="row.progress || 0" :stroke-width="6" :color="getProgressColor(row.progress)" style="width: 120px")
              span.text-xs.font-semibold(style="color: var(--text-primary)") {{ row.progress || 0 }}%
        el-table-column(:label="$t('hr.training.status')" width="130" align="center")
          template(#default="{ row }")
            el-tag(:type="getEnrollmentStatusType(row.status)" effect="dark" size="small" round) {{ row.status }}
        el-table-column(:label="$t('hr.training.score')" width="100" align="center")
          template(#default="{ row }")
            span.text-sm.font-bold(:style="{ color: getScoreColor(row.score) }") {{ row.score != null ? row.score : '--' }}
        el-table-column(:label="$t('hr.training.rating')" width="120" align="center")
          template(#default="{ row }")
            .flex.items-center.justify-center(v-if="row.rating" class="gap-0.5")
              Icon(v-for="i in 5" :key="i" :name="i <= row.rating ? 'ph:star-fill' : 'ph:star'" size="14" :style="{ color: i <= row.rating ? '#f59e0b' : 'var(--text-muted)' }")
            span.text-sm(v-else style="color: var(--text-muted)") --
        el-table-column(:label="$t('common.actions')" width="140" align="center")
          template(#default="{ row }")
            .flex.items-center.justify-center.gap-1
              el-button(v-if="row.status !== 'COMPLETED' && row.status !== 'DROPPED'" text type="success" size="small" @click="handleComplete(row)" :title="$t('hr.training.markComplete')")
                Icon(name="ph:check-circle-bold" size="16")
              el-button(text type="primary" size="small" @click="openEditEnrollment(row)")
                Icon(name="ph:pencil-bold" size="16")
              el-button(text type="danger" size="small" @click="handleDeleteEnrollment(row)")
                Icon(name="ph:trash-bold" size="16")

      .text-center.py-8(v-if="!enrollments.length && !loading")
        Icon(name="ph:users-three" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('hr.training.noParticipants') }}

  //- 404 / Not Found
  .text-center.py-20(v-else-if="!loading")
    Icon(name="ph:warning-circle" size="48" style="color: var(--text-muted)")
    p.text-lg.font-semibold.mt-4(style="color: var(--text-primary)") {{ $t('common.notFound') }}
    NuxtLink(to="/hr/training")
      el-button.mt-4(type="primary") {{ $t('common.goBack') }}

  //- Enroll Dialog
  el-dialog(v-model="enrollDialogVisible" :title="$t('hr.training.enrollParticipant')" width="480px" destroy-on-close)
    el-form(label-position="top")
      el-form-item(:label="$t('hr.training.employee')" required)
        el-select(v-model="enrollForm.employeeId" filterable :placeholder="$t('hr.training.selectEmployee')" class="w-full")
          el-option(v-for="emp in employees" :key="emp.id" :label="emp.name" :value="emp.id")
    template(#footer)
      el-button(@click="enrollDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleEnroll" :loading="saving") {{ $t('hr.training.enroll') }}

  //- Edit Enrollment Dialog
  el-dialog(v-model="editEnrollmentVisible" :title="$t('hr.training.editEnrollment')" width="500px" destroy-on-close)
    el-form(label-position="top" v-if="editingEnrollment")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('hr.training.status')")
          el-select(v-model="editEnrollForm.status" class="w-full")
            el-option(v-for="s in ENROLLMENT_STATUSES" :key="s.value" :label="s.label" :value="s.value")
        el-form-item(:label="$t('hr.training.score')")
          el-input-number(v-model="editEnrollForm.score" :min="0" :max="100" class="w-full")
      el-form-item(:label="$t('hr.training.progress')")
        el-slider(v-model="editEnrollForm.progress" :min="0" :max="100" :step="5" show-input :show-input-controls="false" input-size="small")
      el-form-item(:label="$t('hr.training.feedback')")
        el-input(v-model="editEnrollForm.feedback" type="textarea" :rows="3" :placeholder="$t('hr.training.feedbackPlaceholder')")
      el-form-item(:label="$t('hr.training.rating')")
        el-rate(v-model="editEnrollForm.rating" :max="5" show-text :texts="['Poor', 'Below Average', 'Average', 'Good', 'Excellent']")
    template(#footer)
      el-button(@click="editEnrollmentVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleUpdateEnrollment" :loading="saving") {{ $t('common.save') }}

  //- Edit Program Dialog
  el-dialog(v-model="editProgramVisible" :title="$t('hr.training.editProgram')" width="600px" destroy-on-close)
    el-form(:model="programForm" label-position="top")
      el-form-item(:label="$t('hr.training.programTitle')" required)
        el-input(v-model="programForm.title")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('hr.training.type')")
          el-select(v-model="programForm.type" class="w-full")
            el-option(label="Online" value="ONLINE")
            el-option(label="Classroom" value="CLASSROOM")
            el-option(label="Workshop" value="WORKSHOP")
            el-option(label="Certification" value="CERTIFICATION")
            el-option(label="On the Job" value="ON_THE_JOB")
        el-form-item(:label="$t('hr.training.status')")
          el-select(v-model="programForm.status" class="w-full")
            el-option(label="Draft" value="DRAFT")
            el-option(label="Active" value="ACTIVE")
            el-option(label="Completed" value="COMPLETED")
            el-option(label="Archived" value="ARCHIVED")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('hr.training.category')")
          el-input(v-model="programForm.category")
        el-form-item(:label="$t('hr.training.instructor')")
          el-input(v-model="programForm.instructor")
      .grid.gap-4(class="grid-cols-3")
        el-form-item(:label="$t('hr.training.duration')")
          el-input-number(v-model="programForm.durationHours" :min="0" :max="1000" class="w-full")
        el-form-item(:label="$t('hr.training.maxParticipants')")
          el-input-number(v-model="programForm.maxParticipants" :min="0" class="w-full")
        el-form-item(:label="$t('hr.training.cost')")
          el-input-number(v-model="programForm.cost" :min="0" class="w-full" :controls="false")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('hr.training.startDate')")
          el-date-picker(v-model="programForm.startDate" type="date" class="w-full" value-format="YYYY-MM-DD")
        el-form-item(:label="$t('hr.training.endDate')")
          el-date-picker(v-model="programForm.endDate" type="date" class="w-full" value-format="YYYY-MM-DD")
      el-form-item(:label="$t('hr.training.description')")
        el-input(v-model="programForm.description" type="textarea" :rows="3")
    template(#footer)
      el-button(@click="editProgramVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleUpdateProgram" :loading="saving") {{ $t('common.save') }}

  //- Add Material Dialog
  el-dialog(v-model="showAddMaterial" :title="$t('hr.training.addMaterial')" width="480px" destroy-on-close)
    el-form(label-position="top")
      el-form-item(:label="$t('hr.training.materialName')" required)
        el-input(v-model="materialForm.name" :placeholder="$t('hr.training.materialNamePlaceholder')")
      el-form-item(:label="$t('hr.training.materialUrl')" required)
        el-input(v-model="materialForm.url" :placeholder="$t('hr.training.materialUrlPlaceholder')")
      el-form-item(:label="$t('hr.training.materialType')")
        el-select(v-model="materialForm.type" class="w-full")
          el-option(label="PDF" value="PDF")
          el-option(label="Video" value="VIDEO")
          el-option(label="Slides" value="SLIDES")
          el-option(label="Document" value="DOCUMENT")
          el-option(label="Link" value="LINK")
    template(#footer)
      el-button(@click="showAddMaterial = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleAddMaterial" :loading="saving") {{ $t('common.add') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElNotification, ElMessageBox } from 'element-plus';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;
const route = useRoute();

const loading = ref(false);
const saving = ref(false);
const program = ref<any>(null);
const enrollments = ref<any[]>([]);
const employees = ref<any[]>([]);
const participantStatusFilter = ref('');

// Dialogs
const enrollDialogVisible = ref(false);
const editEnrollmentVisible = ref(false);
const editProgramVisible = ref(false);
const showAddMaterial = ref(false);
const editingEnrollment = ref<any>(null);

const ENROLLMENT_STATUSES = [
  { value: 'ENROLLED', label: 'Enrolled', type: '' },
  { value: 'IN_PROGRESS', label: 'In Progress', type: 'warning' },
  { value: 'COMPLETED', label: 'Completed', type: 'success' },
  { value: 'DROPPED', label: 'Dropped', type: 'danger' },
  { value: 'FAILED', label: 'Failed', type: 'danger' }
];

// Forms
const enrollForm = reactive({ employeeId: '' as string | number });
const editEnrollForm = reactive({ status: 'ENROLLED', progress: 0, score: 0, feedback: '', rating: 0 });
const programForm = reactive({
  title: '',
  type: 'ONLINE',
  status: 'ACTIVE',
  category: '',
  instructor: '',
  durationHours: 0,
  maxParticipants: 0,
  cost: 0,
  startDate: '',
  endDate: '',
  description: ''
});
const materialForm = reactive({ name: '', url: '', type: 'PDF' });

// Computed
const statusCounts = computed(() => {
  const e = enrollments.value;
  return {
    enrolled: e.filter((x: any) => x.status === 'ENROLLED').length,
    inProgress: e.filter((x: any) => x.status === 'IN_PROGRESS').length,
    completed: e.filter((x: any) => x.status === 'COMPLETED').length,
    dropped: e.filter((x: any) => x.status === 'DROPPED').length
  };
});

const completionRate = computed(() => {
  const active = enrollments.value.filter((e: any) => e.status !== 'DROPPED').length;
  if (!active) return 0;
  return Math.round((statusCounts.value.completed / active) * 100);
});

const filteredParticipants = computed(() => {
  if (!participantStatusFilter.value) return enrollments.value;
  return enrollments.value.filter((e: any) => e.status === participantStatusFilter.value);
});

// Helpers
function formatDate(d: string): string {
  if (!d) return '--';
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return d;
  }
}

function getStatusType(status: string): string {
  const map: Record<string, string> = { ACTIVE: 'success', DRAFT: 'info', COMPLETED: '', ARCHIVED: 'danger' };
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

function getScoreColor(score: number | null): string {
  if (score === null || score === undefined) return 'var(--text-muted)';
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

function getInitial(row: any): string {
  const name = row.employee?.firstName || row.employeeName || '?';
  return name.charAt(0).toUpperCase();
}

function getEmployeeName(row: any): string {
  if (row.employee) return `${row.employee.firstName || ''} ${row.employee.lastName || ''}`.trim() || `Employee #${row.employeeId}`;
  return row.employeeName || `Employee #${row.employeeId}`;
}

function getMaterialIcon(type: string): string {
  const map: Record<string, string> = {
    PDF: 'ph:file-pdf-bold',
    VIDEO: 'ph:video-bold',
    SLIDES: 'ph:presentation-bold',
    DOCUMENT: 'ph:file-doc-bold',
    LINK: 'ph:link-bold'
  };
  return map[type] || 'ph:file-bold';
}

function getMaterialColor(type: string): string {
  const map: Record<string, string> = {
    PDF: '#ef4444',
    VIDEO: '#8b5cf6',
    SLIDES: '#f59e0b',
    DOCUMENT: '#3b82f6',
    LINK: '#22c55e'
  };
  return map[type] || '#7849ff';
}

function getMaterialBg(type: string): string {
  const color = getMaterialColor(type);
  return color.replace('#', 'rgba(')
    ? `rgba(${parseInt(getMaterialColor(type).slice(1, 3), 16)}, ${parseInt(getMaterialColor(type).slice(3, 5), 16)}, ${parseInt(getMaterialColor(type).slice(5, 7), 16)}, 0.12)`
    : 'rgba(120, 73, 255, 0.12)';
}

// Data fetching
async function loadProgram() {
  loading.value = true;
  try {
    const id = route.params.id;
    const res = await useApiFetch(`hr/training/programs/${id}`);
    if (res?.success && res.body) {
      const data = res.body as any;
      program.value = data;
      enrollments.value = data.enrollments || [];
    }
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.loadFailed') });
  } finally {
    loading.value = false;
  }
}

async function loadEmployees() {
  try {
    const res = await useApiFetch('hr/employees?limit=500');
    if (res?.success && res.body) {
      const docs = (res.body as any).docs || res.body || [];
      employees.value = docs.map((e: any) => ({
        id: e.id,
        name: e.firstName ? `${e.firstName} ${e.lastName || ''}`.trim() : e.name || `Employee #${e.id}`
      }));
    }
  } catch {
    /* silently ignore */
  }
}

// Enrollment CRUD
function openEnrollDialog() {
  enrollForm.employeeId = '';
  enrollDialogVisible.value = true;
}

async function handleEnroll() {
  if (!enrollForm.employeeId) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }
  saving.value = true;
  try {
    await useApiFetch('hr/training/enrollments/with-capacity', 'POST', {
      programId: Number(route.params.id),
      employeeId: Number(enrollForm.employeeId)
    });
    enrollDialogVisible.value = false;
    ElNotification({ type: 'success', title: t('common.success'), message: t('hr.training.enrolled') });
    await loadProgram();
  } catch (err: any) {
    ElNotification({ type: 'error', title: t('common.error'), message: err?.message || t('common.error') });
  } finally {
    saving.value = false;
  }
}

function openEditEnrollment(row: any) {
  editingEnrollment.value = row;
  editEnrollForm.status = row.status || 'ENROLLED';
  editEnrollForm.progress = row.progress || 0;
  editEnrollForm.score = row.score || 0;
  editEnrollForm.feedback = row.feedback || '';
  editEnrollForm.rating = row.rating || 0;
  editEnrollmentVisible.value = true;
}

async function handleUpdateEnrollment() {
  if (!editingEnrollment.value) return;
  saving.value = true;
  try {
    await useApiFetch(`hr/training/enrollments/${editingEnrollment.value.id}`, 'PUT', { ...editEnrollForm });
    editEnrollmentVisible.value = false;
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
    await loadProgram();
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

async function handleComplete(row: any) {
  try {
    await ElMessageBox.confirm(t('hr.training.confirmComplete'), t('common.confirm'), { type: 'info' });
    await useApiFetch(`hr/training/enrollments/${row.id}/complete`, 'PUT');
    ElNotification({ type: 'success', title: t('common.success'), message: t('hr.training.completedSuccess') });
    await loadProgram();
  } catch {
    /* cancelled */
  }
}

async function handleDeleteEnrollment(row: any) {
  try {
    await ElMessageBox.confirm(t('common.confirmDelete'), t('common.warning'), { type: 'warning' });
    await useApiFetch(`hr/training/enrollments/${row.id}`, 'DELETE');
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
    await loadProgram();
  } catch {
    /* cancelled */
  }
}

// Program edit
function openEditDialog() {
  if (!program.value) return;
  const p = program.value;
  programForm.title = p.title || '';
  programForm.type = p.type || 'ONLINE';
  programForm.status = p.status || 'ACTIVE';
  programForm.category = p.category || '';
  programForm.instructor = p.instructor || '';
  programForm.durationHours = p.durationHours || 0;
  programForm.maxParticipants = p.maxParticipants || 0;
  programForm.cost = p.cost || 0;
  programForm.startDate = p.startDate || '';
  programForm.endDate = p.endDate || '';
  programForm.description = p.description || '';
  editProgramVisible.value = true;
}

async function handleUpdateProgram() {
  saving.value = true;
  try {
    await useApiFetch(`hr/training/programs/${route.params.id}`, 'PUT', { ...programForm });
    editProgramVisible.value = false;
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
    await loadProgram();
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

// Materials
async function handleAddMaterial() {
  if (!materialForm.name || !materialForm.url) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }
  saving.value = true;
  try {
    const currentMaterials = program.value?.materials || [];
    const updatedMaterials = [...currentMaterials, { name: materialForm.name, url: materialForm.url, type: materialForm.type }];
    await useApiFetch(`hr/training/programs/${route.params.id}`, 'PUT', { materials: updatedMaterials });
    showAddMaterial.value = false;
    materialForm.name = '';
    materialForm.url = '';
    materialForm.type = 'PDF';
    ElNotification({ type: 'success', title: t('common.success'), message: t('hr.training.materialAdded') });
    await loadProgram();
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadProgram();
  loadEmployees();
});
</script>

<style lang="scss" scoped>
.glass-card {
  background: var(--bg-elevated, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--border-default, rgba(255, 255, 255, 0.08));
  border-radius: 16px;
}
</style>
