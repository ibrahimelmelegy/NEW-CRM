<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-8
    div
      .title.font-bold.text-2xl.mb-1(style="color: var(--text-primary)") {{ $t('hr.recruitment.title') || 'Recruitment & ATS' }}
      p.text-sm(style="color: var(--text-muted)") {{ $t('hr.recruitment.subtitle') || 'Post jobs, track applicants, and manage your hiring pipeline' }}
    .flex.items-center.gap-x-3
      el-button(v-if="activeTab === 'postings'" size="large" type="primary" @click="openPostingDialog()" class="!rounded-2xl")
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('hr.recruitment.newPosting') || 'New Job Posting' }}
      el-button(v-if="activeTab === 'applicants'" size="large" type="primary" @click="openApplicantDialog()" class="!rounded-2xl")
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('hr.recruitment.newApplicant') || 'New Applicant' }}

  //- Stats Cards
  .grid.grid-cols-2.gap-4.mb-6(class="lg:grid-cols-4")
    .glass-card.p-5.rounded-2xl.text-center
      .text-2xl.font-bold(style="color: #7849ff") {{ postings.length }}
      .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.recruitment.totalPostings') || 'Job Postings' }}
    .glass-card.p-5.rounded-2xl.text-center
      .text-2xl.font-bold(style="color: #22c55e") {{ postings.filter(p => p.status === 'OPEN').length }}
      .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.recruitment.openPositions') || 'Open Positions' }}
    .glass-card.p-5.rounded-2xl.text-center
      .text-2xl.font-bold(style="color: #3b82f6") {{ applicants.length }}
      .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.recruitment.totalApplicants') || 'Total Applicants' }}
    .glass-card.p-5.rounded-2xl.text-center
      .text-2xl.font-bold(style="color: #f59e0b") {{ applicants.filter(a => a.stage === 'INTERVIEW').length }}
      .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('hr.recruitment.inInterview') || 'In Interview' }}

  //- Recruitment Funnel Section
  .glass-card.p-6.rounded-2xl.mb-6
    .flex.items-center.justify-between.mb-4
      .flex.items-center.gap-2
        Icon(name="ph:funnel-bold" size="20" style="color: #3b82f6")
        span.text-sm.font-semibold(style="color: var(--text-primary)") Recruitment Funnel
      el-select(v-model="selectedPostingId" :placeholder="$t('hr.recruitment.selectPosting') || 'Select a job posting'" size="small" style="width: 260px" @change="loadFunnel" filterable)
        el-option(v-for="p in postings" :key="p.id" :label="p.title" :value="p.id")
    div(v-if="!selectedPostingId")
      .text-center.py-6
        Icon(name="ph:funnel-simple-bold" size="40" style="color: var(--text-muted); opacity: 0.3")
        p.text-sm.mt-2(style="color: var(--text-muted)") Select a job posting to view its recruitment funnel
    div(v-else v-loading="funnelLoading")
      //- Funnel Pipeline
      .flex.items-end.gap-1.mb-4(class="flex-wrap md:flex-nowrap" style="min-height: 120px")
        .flex-1.text-center(v-for="(stage, idx) in funnelStages" :key="stage.name" style="min-width: 80px")
          .mx-auto.rounded-t-lg.transition-all.duration-500(
            :style="{ width: funnelBarWidth(stage.count), height: funnelBarHeight(stage.count) + 'px', background: stage.color, minHeight: '24px', minWidth: '40px' }"
          )
            .text-xs.font-bold.text-white.pt-1 {{ stage.count }}
          .text-xs.font-medium.mt-2(style="color: var(--text-primary)") {{ stage.name }}
          div.text-xs(v-if="idx > 0" class="mt-0.5" style="color: var(--text-muted)")
            span(v-if="funnelStages[idx - 1].count > 0") {{ Math.round((stage.count / funnelStages[idx - 1].count) * 100) }}%
            span(v-else) --
      //- Funnel Table
      .glass-card.rounded-xl.overflow-hidden.mt-4(style="border: 1px solid var(--border-default, rgba(255,255,255,0.06))")
        el-table(:data="funnelStages" style="width: 100%" size="small")
          el-table-column(label="Stage" min-width="140")
            template(#default="{ row }")
              .flex.items-center.gap-2
                .w-3.h-3.rounded-full(:style="{ background: row.color }")
                span.text-sm.font-medium(style="color: var(--text-primary)") {{ row.name }}
          el-table-column(label="Count" width="100" align="center")
            template(#default="{ row }")
              span.text-sm.font-bold(style="color: var(--text-primary)") {{ row.count }}
          el-table-column(label="Conversion" width="120" align="center")
            template(#default="{ row, $index }")
              span.text-sm(v-if="$index === 0" style="color: var(--text-muted)") --
              span.text-sm.font-semibold(v-else-if="funnelStages[$index - 1].count > 0" :style="{ color: conversionColor(row.count, funnelStages[$index - 1].count) }") {{ Math.round((row.count / funnelStages[$index - 1].count) * 100) }}%
              span.text-sm(v-else style="color: var(--text-muted)") --
          el-table-column(label="Drop-off" width="120" align="center")
            template(#default="{ row, $index }")
              span.text-sm(v-if="$index === 0" style="color: var(--text-muted)") --
              span.text-sm(v-else style="color: #ef4444") {{ Math.max(0, funnelStages[$index - 1].count - row.count) }}

  //- Tabs
  el-tabs(v-model="activeTab")
    //- Job Postings Tab
    el-tab-pane(:label="$t('hr.recruitment.jobPostings') || 'Job Postings'" name="postings")
      //- Filters
      .flex.items-center.gap-3.mb-4
        el-input(v-model="postingSearch" :placeholder="$t('common.search') || 'Search'" clearable style="width: 260px" size="large" class="!rounded-xl")
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")
        el-select(v-model="postingStatusFilter" :placeholder="$t('hr.recruitment.allStatuses') || 'All Statuses'" clearable size="large" style="width: 180px")
          el-option(label="All Statuses" value="")
          el-option(v-for="s in POSTING_STATUSES" :key="s.value" :label="s.label" :value="s.value")

      //- Postings Table
      .glass-card.rounded-2xl.overflow-hidden
        el-table(:data="filteredPostings" v-loading="loading" style="width: 100%" stripe)
          el-table-column(:label="$t('hr.recruitment.jobTitle') || 'Title'" min-width="220" prop="title")
            template(#default="{ row }")
              .flex.items-center.gap-3
                .w-9.h-9.rounded-xl.flex.items-center.justify-center.shrink-0(style="background: rgba(59, 130, 246, 0.15)")
                  Icon(name="ph:briefcase-bold" size="18" style="color: #3b82f6")
                div
                  p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.title || '--' }}
                  p.text-xs(style="color: var(--text-muted)") {{ row.department || '' }}
          el-table-column(:label="$t('hr.recruitment.department') || 'Department'" min-width="140" prop="department")
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-primary)") {{ row.department || '--' }}
          el-table-column(:label="$t('hr.recruitment.type') || 'Type'" width="130" prop="type")
            template(#default="{ row }")
              el-tag(effect="plain" size="small") {{ row.type || '--' }}
          el-table-column(:label="$t('hr.recruitment.openPositions') || 'Open'" width="100" align="center" prop="openPositions")
            template(#default="{ row }")
              span.text-sm.font-bold(style="color: var(--text-primary)") {{ row.openPositions || 0 }}
          el-table-column(:label="$t('hr.recruitment.status') || 'Status'" width="130" align="center")
            template(#default="{ row }")
              el-tag(:type="getPostingStatusType(row.status)" effect="dark" size="small" round) {{ row.status }}
          el-table-column(:label="$t('hr.recruitment.closingDate') || 'Closing Date'" width="140")
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-muted)") {{ formatDate(row.closingDate) }}
          el-table-column(:label="$t('common.actions') || 'Actions'" width="120" align="center")
            template(#default="{ row }")
              .flex.items-center.justify-center.gap-1
                el-button(text type="primary" size="small" @click="openPostingDialog(row)")
                  Icon(name="ph:pencil-bold" size="16")
                el-button(text type="danger" size="small" @click="handleDeletePosting(row)")
                  Icon(name="ph:trash-bold" size="16")

        .flex.justify-end.mt-4
          el-pagination(
            :current-page="postingsPagination.page"
            :page-size="postingsPagination.limit"
            :total="postingsPagination.total"
            layout="total, prev, pager, next"
            @current-change="(p: number) => { postingsPagination.page = p; loadData() }"
          )

    //- Applicants Tab
    el-tab-pane(:label="$t('hr.recruitment.applicants') || 'Applicants'" name="applicants")
      //- Filters
      .flex.items-center.gap-3.mb-4
        el-input(v-model="applicantSearch" :placeholder="$t('common.search') || 'Search'" clearable style="width: 260px" size="large" class="!rounded-xl")
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")
        el-select(v-model="applicantStageFilter" :placeholder="$t('hr.recruitment.allStages') || 'All Stages'" clearable size="large" style="width: 180px")
          el-option(label="All Stages" value="")
          el-option(v-for="s in APPLICANT_STAGES" :key="s.value" :label="s.label" :value="s.value")

      //- Applicants Table
      .glass-card.rounded-2xl.overflow-hidden
        el-table(:data="filteredApplicants" v-loading="loading" style="width: 100%" stripe)
          el-table-column(:label="$t('hr.recruitment.applicantName') || 'Name'" min-width="200")
            template(#default="{ row }")
              .flex.items-center.gap-3
                .w-9.h-9.rounded-full.flex.items-center.justify-center.shrink-0(style="background: rgba(120, 73, 255, 0.15)")
                  span.text-sm.font-bold(style="color: #7849ff") {{ (row.name || '?').charAt(0).toUpperCase() }}
                div
                  p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.name || '--' }}
                  p.text-xs(style="color: var(--text-muted)") {{ row.email || '' }}
          el-table-column(:label="$t('hr.recruitment.email') || 'Email'" min-width="200" prop="email")
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-primary)") {{ row.email || '--' }}
          el-table-column(:label="$t('hr.recruitment.jobPosting') || 'Job Posting'" min-width="180" prop="jobPostingTitle")
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-primary)") {{ row.jobPostingTitle || '--' }}
          el-table-column(:label="$t('hr.recruitment.stage') || 'Stage'" width="140" align="center")
            template(#default="{ row }")
              el-tag(:type="getStageType(row.stage)" effect="dark" size="small" round) {{ row.stage }}
          el-table-column(:label="$t('hr.recruitment.rating') || 'Rating'" width="120" align="center")
            template(#default="{ row }")
              el-rate(:model-value="row.rating || 0" disabled :max="5" size="small")
          el-table-column(:label="$t('hr.recruitment.source') || 'Source'" width="130" prop="source")
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-muted)") {{ row.source || '--' }}
          el-table-column(:label="$t('common.actions') || 'Actions'" width="120" align="center")
            template(#default="{ row }")
              .flex.items-center.justify-center.gap-1
                el-button(text type="primary" size="small" @click="openApplicantDialog(row)")
                  Icon(name="ph:pencil-bold" size="16")
                el-button(text type="danger" size="small" @click="handleDeleteApplicant(row)")
                  Icon(name="ph:trash-bold" size="16")

        .flex.justify-end.mt-4
          el-pagination(
            :current-page="applicantsPagination.page"
            :page-size="applicantsPagination.limit"
            :total="applicantsPagination.total"
            layout="total, prev, pager, next"
            @current-change="(p: number) => { applicantsPagination.page = p; loadData() }"
          )

  //- Job Posting Dialog
  el-dialog(v-model="postingDialogVisible" :title="editingPosting ? ($t('hr.recruitment.editPosting') || 'Edit Job Posting') : ($t('hr.recruitment.newPosting') || 'New Job Posting')" width="600px" destroy-on-close)
    el-form(:model="postingForm" label-position="top")
      el-form-item(:label="$t('hr.recruitment.jobTitle') || 'Job Title'" required)
        el-input(v-model="postingForm.title" :placeholder="$t('hr.recruitment.jobTitlePlaceholder') || 'e.g., Senior Frontend Developer'")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('hr.recruitment.department') || 'Department'" required)
          el-select(v-model="postingForm.department" class="w-full" filterable allow-create :placeholder="$t('hr.recruitment.selectDepartment') || 'Select department'")
            el-option(v-for="dept in departments" :key="dept" :label="dept" :value="dept")
        el-form-item(:label="$t('hr.recruitment.type') || 'Employment Type'")
          el-select(v-model="postingForm.type" class="w-full")
            el-option(label="Full-time" value="FULL_TIME")
            el-option(label="Part-time" value="PART_TIME")
            el-option(label="Contract" value="CONTRACT")
            el-option(label="Internship" value="INTERNSHIP")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('hr.recruitment.openPositions') || 'Open Positions'")
          el-input-number(v-model="postingForm.openPositions" :min="1" :max="100" class="w-full")
        el-form-item(:label="$t('hr.recruitment.closingDate') || 'Closing Date'")
          el-date-picker(v-model="postingForm.closingDate" type="date" :placeholder="$t('hr.recruitment.selectDate') || 'Select date'" class="w-full")
      el-form-item(:label="$t('hr.recruitment.status') || 'Status'")
        el-select(v-model="postingForm.status" class="w-full")
          el-option(v-for="s in POSTING_STATUSES" :key="s.value" :label="s.label" :value="s.value")
      el-form-item(:label="$t('hr.recruitment.description') || 'Job Description'")
        el-input(v-model="postingForm.description" type="textarea" :rows="4" :placeholder="$t('hr.recruitment.descriptionPlaceholder') || 'Enter job description...'")
    template(#footer)
      el-button(@click="postingDialogVisible = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" @click="handleSavePosting" :loading="saving") {{ $t('common.save') || 'Save' }}

  //- Applicant Dialog
  el-dialog(v-model="applicantDialogVisible" :title="editingApplicant ? ($t('hr.recruitment.editApplicant') || 'Edit Applicant') : ($t('hr.recruitment.newApplicant') || 'New Applicant')" width="600px" destroy-on-close)
    el-form(:model="applicantForm" label-position="top")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('hr.recruitment.applicantName') || 'Full Name'" required)
          el-input(v-model="applicantForm.name" :placeholder="$t('hr.recruitment.namePlaceholder') || 'Enter full name'")
        el-form-item(:label="$t('hr.recruitment.email') || 'Email'" required)
          el-input(v-model="applicantForm.email" type="email" :placeholder="$t('hr.recruitment.emailPlaceholder') || 'Enter email'")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('hr.recruitment.jobPosting') || 'Job Posting'" required)
          el-select(v-model="applicantForm.jobPostingId" class="w-full" filterable :placeholder="$t('hr.recruitment.selectPosting') || 'Select job posting'")
            el-option(v-for="p in postings" :key="p.id" :label="p.title" :value="p.id")
        el-form-item(:label="$t('hr.recruitment.stage') || 'Stage'")
          el-select(v-model="applicantForm.stage" class="w-full")
            el-option(v-for="s in APPLICANT_STAGES" :key="s.value" :label="s.label" :value="s.value")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('hr.recruitment.rating') || 'Rating'")
          el-rate(v-model="applicantForm.rating" :max="5" allow-half)
        el-form-item(:label="$t('hr.recruitment.source') || 'Source'")
          el-select(v-model="applicantForm.source" class="w-full" filterable allow-create :placeholder="$t('hr.recruitment.selectSource') || 'Select source'")
            el-option(label="LinkedIn" value="LinkedIn")
            el-option(label="Indeed" value="Indeed")
            el-option(label="Referral" value="Referral")
            el-option(label="Website" value="Website")
            el-option(label="Job Board" value="Job Board")
            el-option(label="Other" value="Other")
      el-form-item(:label="$t('hr.recruitment.phone') || 'Phone'")
        el-input(v-model="applicantForm.phone" :placeholder="$t('hr.recruitment.phonePlaceholder') || 'Enter phone number'")
      el-form-item(:label="$t('hr.recruitment.notes') || 'Notes'")
        el-input(v-model="applicantForm.notes" type="textarea" :rows="3" :placeholder="$t('hr.recruitment.notesPlaceholder') || 'Add notes about the applicant...'")
    template(#footer)
      el-button(@click="applicantDialogVisible = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" @click="handleSaveApplicant" :loading="saving") {{ $t('common.save') || 'Save' }}
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { ElNotification, ElMessageBox } from 'element-plus';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(false);
const saving = ref(false);
const activeTab = ref('postings');

// Postings state
const postingDialogVisible = ref(false);
const editingPosting = ref<any>(null);
const postingSearch = ref('');
const postingStatusFilter = ref('');
const postings = ref<any[]>([]);
const postingsPagination = reactive({ page: 1, limit: 20, total: 0 });

// Applicants state
const applicantDialogVisible = ref(false);
const editingApplicant = ref<any>(null);
const applicantSearch = ref('');
const applicantStageFilter = ref('');
const applicants = ref<any[]>([]);
const applicantsPagination = reactive({ page: 1, limit: 20, total: 0 });

const departments = ref<string[]>(['Engineering', 'Sales', 'Marketing', 'HR', 'Operations', 'Finance', 'Design', 'Product']);

// Funnel state
const selectedPostingId = ref<number | string>('');
const funnelLoading = ref(false);

interface FunnelStage {
  name: string;
  count: number;
  color: string;
}

const funnelStages = ref<FunnelStage[]>([
  { name: 'Applied', count: 0, color: '#6366f1' },
  { name: 'Screening', count: 0, color: '#3b82f6' },
  { name: 'Interview', count: 0, color: '#f59e0b' },
  { name: 'Assessment', count: 0, color: '#8b5cf6' },
  { name: 'Offer', count: 0, color: '#22c55e' },
  { name: 'Hired', count: 0, color: '#10b981' }
]);

const POSTING_STATUSES = [
  { value: 'OPEN', label: 'Open', type: 'success' },
  { value: 'CLOSED', label: 'Closed', type: 'danger' },
  { value: 'DRAFT', label: 'Draft', type: 'info' },
  { value: 'ON_HOLD', label: 'On Hold', type: 'warning' }
];

const APPLICANT_STAGES = [
  { value: 'APPLIED', label: 'Applied', type: 'info' },
  { value: 'SCREENING', label: 'Screening', type: '' },
  { value: 'INTERVIEW', label: 'Interview', type: 'warning' },
  { value: 'OFFER', label: 'Offer', type: 'success' },
  { value: 'HIRED', label: 'Hired', type: 'success' },
  { value: 'REJECTED', label: 'Rejected', type: 'danger' }
];

// Forms
const postingForm = reactive({
  title: '',
  department: '',
  status: 'OPEN',
  type: 'FULL_TIME',
  openPositions: 1,
  closingDate: '',
  description: ''
});

const applicantForm = reactive({
  name: '',
  email: '',
  jobPostingId: '' as string | number,
  stage: 'APPLIED',
  rating: 0,
  source: '',
  phone: '',
  notes: ''
});

// Computed filtered lists
const filteredPostings = computed(() => {
  let data = postings.value;
  if (postingStatusFilter.value) {
    data = data.filter(p => p.status === postingStatusFilter.value);
  }
  if (postingSearch.value) {
    const q = postingSearch.value.toLowerCase();
    data = data.filter(p =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.department || '').toLowerCase().includes(q)
    );
  }
  return data;
});

const filteredApplicants = computed(() => {
  let data = applicants.value;
  if (applicantStageFilter.value) {
    data = data.filter(a => a.stage === applicantStageFilter.value);
  }
  if (applicantSearch.value) {
    const q = applicantSearch.value.toLowerCase();
    data = data.filter(a =>
      (a.name || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q) ||
      (a.jobPostingTitle || '').toLowerCase().includes(q)
    );
  }
  return data;
});

// Helpers
function getPostingStatusType(status: string): string {
  const map: Record<string, string> = { OPEN: 'success', CLOSED: 'danger', DRAFT: 'info', ON_HOLD: 'warning' };
  return map[status] || 'info';
}

function getStageType(stage: string): string {
  const map: Record<string, string> = { APPLIED: 'info', SCREENING: '', INTERVIEW: 'warning', OFFER: 'success', HIRED: 'success', REJECTED: 'danger' };
  return map[stage] || 'info';
}

function formatDate(d: string) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Posting CRUD
function resetPostingForm() {
  postingForm.title = '';
  postingForm.department = '';
  postingForm.status = 'OPEN';
  postingForm.type = 'FULL_TIME';
  postingForm.openPositions = 1;
  postingForm.closingDate = '';
  postingForm.description = '';
}

function openPostingDialog(item?: any) {
  if (item?.id) {
    editingPosting.value = item;
    postingForm.title = item.title || '';
    postingForm.department = item.department || '';
    postingForm.status = item.status || 'OPEN';
    postingForm.type = item.type || 'FULL_TIME';
    postingForm.openPositions = item.openPositions || 1;
    postingForm.closingDate = item.closingDate || '';
    postingForm.description = item.description || '';
  } else {
    editingPosting.value = null;
    resetPostingForm();
  }
  postingDialogVisible.value = true;
}

async function handleSavePosting() {
  if (!postingForm.title || !postingForm.department) {
    ElNotification({ type: 'warning', title: t('common.warning') || 'Warning', message: t('common.fillRequired') || 'Please fill all required fields' });
    return;
  }
  saving.value = true;
  try {
    const payload = { ...postingForm };
    if (editingPosting.value) {
      await useApiFetch(`hr/recruitment/postings/${editingPosting.value.id}`, 'PUT', payload);
    } else {
      await useApiFetch('hr/recruitment/postings', 'POST', payload);
    }
    await loadData();
    postingDialogVisible.value = false;
    ElNotification({ type: 'success', title: t('common.success') || 'Success', message: t('common.saved') || 'Saved successfully' });
  } catch {
    ElNotification({ type: 'error', title: t('common.error') || 'Error', message: t('common.error') || 'An error occurred' });
  } finally {
    saving.value = false;
  }
}

async function handleDeletePosting(row: any) {
  try {
    await ElMessageBox.confirm(
      t('common.confirmDelete') || 'Are you sure you want to delete this posting?',
      t('common.warning') || 'Warning',
      { type: 'warning' }
    );
    loading.value = true;
    await useApiFetch(`hr/recruitment/postings/${row.id}`, 'DELETE');
    await loadData();
    ElNotification({ type: 'success', title: t('common.success') || 'Success', message: t('common.deleted') || 'Deleted successfully' });
  } catch {
    // User cancelled or error
  } finally {
    loading.value = false;
  }
}

// Applicant CRUD
function resetApplicantForm() {
  applicantForm.name = '';
  applicantForm.email = '';
  applicantForm.jobPostingId = '';
  applicantForm.stage = 'APPLIED';
  applicantForm.rating = 0;
  applicantForm.source = '';
  applicantForm.phone = '';
  applicantForm.notes = '';
}

function openApplicantDialog(item?: any) {
  if (item?.id) {
    editingApplicant.value = item;
    applicantForm.name = item.name || '';
    applicantForm.email = item.email || '';
    applicantForm.jobPostingId = item.jobPostingId || '';
    applicantForm.stage = item.stage || 'APPLIED';
    applicantForm.rating = item.rating || 0;
    applicantForm.source = item.source || '';
    applicantForm.phone = item.phone || '';
    applicantForm.notes = item.notes || '';
  } else {
    editingApplicant.value = null;
    resetApplicantForm();
  }
  applicantDialogVisible.value = true;
}

async function handleSaveApplicant() {
  if (!applicantForm.name || !applicantForm.email || !applicantForm.jobPostingId) {
    ElNotification({ type: 'warning', title: t('common.warning') || 'Warning', message: t('common.fillRequired') || 'Please fill all required fields' });
    return;
  }
  saving.value = true;
  try {
    const payload = { ...applicantForm };
    if (editingApplicant.value) {
      await useApiFetch(`hr/recruitment/applicants/${editingApplicant.value.id}`, 'PUT', payload);
    } else {
      await useApiFetch('hr/recruitment/applicants', 'POST', payload);
    }
    await loadData();
    applicantDialogVisible.value = false;
    ElNotification({ type: 'success', title: t('common.success') || 'Success', message: t('common.saved') || 'Saved successfully' });
  } catch {
    ElNotification({ type: 'error', title: t('common.error') || 'Error', message: t('common.error') || 'An error occurred' });
  } finally {
    saving.value = false;
  }
}

async function handleDeleteApplicant(row: any) {
  try {
    await ElMessageBox.confirm(
      t('common.confirmDelete') || 'Are you sure you want to delete this applicant?',
      t('common.warning') || 'Warning',
      { type: 'warning' }
    );
    loading.value = true;
    await useApiFetch(`hr/recruitment/applicants/${row.id}`, 'DELETE');
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
    const [postingsRes, applicantsRes] = await Promise.all([
      useApiFetch(`hr/recruitment/postings?page=${postingsPagination.page}&limit=${postingsPagination.limit}`),
      useApiFetch(`hr/recruitment/applicants?page=${applicantsPagination.page}&limit=${applicantsPagination.limit}`)
    ]);
    if (postingsRes?.success && postingsRes.body) {
      const data = postingsRes.body as any;
      postings.value = data.rows || data.docs || data || [];
      postingsPagination.total = data.count ?? data.total ?? postings.value.length;
    }
    if (applicantsRes?.success && applicantsRes.body) {
      const data = applicantsRes.body as any;
      applicants.value = data.rows || data.docs || data || [];
      applicantsPagination.total = data.count ?? data.total ?? applicants.value.length;
    }
  } finally {
    loading.value = false;
  }
}

// Funnel helpers
function funnelBarWidth(count: number): string {
  const max = Math.max(...funnelStages.value.map(s => s.count), 1);
  return Math.max(40, Math.round((count / max) * 100)) + '%';
}

function funnelBarHeight(count: number): number {
  const max = Math.max(...funnelStages.value.map(s => s.count), 1);
  return Math.max(24, Math.round((count / max) * 100));
}

function conversionColor(current: number, previous: number): string {
  if (!previous) return 'var(--text-muted)';
  const pct = (current / previous) * 100;
  if (pct >= 60) return '#22c55e';
  if (pct >= 30) return '#f59e0b';
  return '#ef4444';
}

async function loadFunnel() {
  if (!selectedPostingId.value) return;
  funnelLoading.value = true;
  try {
    const res = await useApiFetch(`hr/recruitment/postings/${selectedPostingId.value}/funnel`);
    if (res?.success && res.body) {
      const d = res.body as any;
      funnelStages.value = [
        { name: 'Applied', count: d.applied ?? 0, color: '#6366f1' },
        { name: 'Screening', count: d.screening ?? 0, color: '#3b82f6' },
        { name: 'Interview', count: d.interview ?? 0, color: '#f59e0b' },
        { name: 'Assessment', count: d.assessment ?? 0, color: '#8b5cf6' },
        { name: 'Offer', count: d.offer ?? 0, color: '#22c55e' },
        { name: 'Hired', count: d.hired ?? 0, color: '#10b981' }
      ];
    }
  } catch {
    // Funnel data is supplementary; silently ignore errors
  } finally {
    funnelLoading.value = false;
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
