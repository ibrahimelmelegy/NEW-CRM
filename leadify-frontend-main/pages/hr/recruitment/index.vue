<template lang="pug">
div
  //- Header
  ModuleHeader(
    :title="$t('recruitment.title') || 'Recruitment & ATS'"
    :subtitle="$t('recruitment.subtitle') || 'Post jobs, track applicants, and manage your hiring pipeline'"
  )
    template(#actions)
      el-button(v-if="activeTab === 'postings'" size="large" type="primary" @click="openPostingDialog()" class="!rounded-2xl")
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('recruitment.newPosting') || 'New Job Posting' }}
      el-button(v-if="activeTab === 'applicants'" size="large" type="primary" @click="openApplicantDialog()" class="!rounded-2xl")
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('recruitment.newApplicant') || 'New Applicant' }}

  //- KPI Stats
  StatCards(:stats="kpiStats")

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  template(v-else)
    //- Tabs
    el-tabs(v-model="activeTab")

      //- ─── Job Postings Tab ───────────────────────────────────
      el-tab-pane(:label="$t('recruitment.jobPostings') || 'Job Postings'" name="postings")
        //- Status filter tabs
        .flex.items-center.gap-3.mb-4.flex-wrap
          el-radio-group(v-model="postingStatusFilter" size="default")
            el-radio-button(value="") {{ $t('common.all') || 'All' }} ({{ postings.length }})
            el-radio-button(value="OPEN") {{ $t('recruitment.open') || 'Open' }} ({{ postings.filter(p => p.status === 'OPEN').length }})
            el-radio-button(value="DRAFT") {{ $t('recruitment.draft') || 'Draft' }} ({{ postings.filter(p => p.status === 'DRAFT').length }})
            el-radio-button(value="CLOSED") {{ $t('recruitment.closed') || 'Closed' }} ({{ postings.filter(p => p.status === 'CLOSED').length }})
          .flex-1
          el-input(v-model="postingSearch" :placeholder="$t('common.search') || 'Search'" clearable style="max-width: 260px" size="large" class="!rounded-xl")
            template(#prefix)
              Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")

        //- Desktop Table (hidden on mobile)
        .glass-card.rounded-2xl.overflow-hidden.hidden(class="md:block")
          el-table(:data="filteredPostings" style="width: 100%" stripe @row-click="navigateToPosting")
            el-table-column(:label="$t('recruitment.jobTitle') || 'Title'" min-width="220")
              template(#default="{ row }")
                .flex.items-center.gap-3.cursor-pointer
                  .w-9.h-9.rounded-xl.flex.items-center.justify-center.shrink-0(style="background: rgba(59, 130, 246, 0.15)")
                    Icon(name="ph:briefcase-bold" size="18" style="color: #3b82f6")
                  div
                    p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.title || '--' }}
                    p.text-xs(style="color: var(--text-muted)") {{ row.department?.name || row.department || '--' }}
            el-table-column(:label="$t('recruitment.location') || 'Location'" min-width="140")
              template(#default="{ row }")
                .flex.items-center.gap-1
                  Icon(name="ph:map-pin" size="14" style="color: var(--text-muted)")
                  span.text-sm(style="color: var(--text-primary)") {{ row.location || '--' }}
            el-table-column(:label="$t('recruitment.type') || 'Type'" width="130")
              template(#default="{ row }")
                el-tag(effect="plain" size="small" round) {{ formatType(row.type) }}
            el-table-column(:label="$t('recruitment.openPositions') || 'Positions'" width="100" align="center")
              template(#default="{ row }")
                span.text-sm.font-bold(style="color: var(--text-primary)") {{ row.openPositions || 1 }}
            el-table-column(:label="$t('recruitment.applicantCount') || 'Applicants'" width="110" align="center")
              template(#default="{ row }")
                .flex.items-center.justify-center.gap-1
                  Icon(name="ph:users" size="14" style="color: #7849ff")
                  span.text-sm.font-semibold(style="color: #7849ff") {{ row.applicantCount || 0 }}
            el-table-column(:label="$t('recruitment.status') || 'Status'" width="120" align="center")
              template(#default="{ row }")
                el-tag(:type="getPostingStatusType(row.status)" effect="dark" size="small" round) {{ row.status }}
            el-table-column(:label="$t('recruitment.postedDate') || 'Posted'" width="130")
              template(#default="{ row }")
                span.text-sm(style="color: var(--text-muted)") {{ formatDate(row.createdAt) }}
            el-table-column(:label="$t('common.actions') || 'Actions'" width="140" align="center")
              template(#default="{ row }")
                .flex.items-center.justify-center.gap-1
                  el-tooltip(:content="$t('recruitment.viewDetails') || 'View Details'" placement="top")
                    el-button(text type="primary" size="small" @click.stop="navigateToPosting(row)")
                      Icon(name="ph:eye-bold" size="16")
                  el-tooltip(:content="$t('common.edit') || 'Edit'" placement="top")
                    el-button(text type="primary" size="small" @click.stop="openPostingDialog(row)")
                      Icon(name="ph:pencil-bold" size="16")
                  el-tooltip(:content="$t('common.delete') || 'Delete'" placement="top")
                    el-button(text type="danger" size="small" @click.stop="handleDeletePosting(row)")
                      Icon(name="ph:trash-bold" size="16")

        //- Mobile Cards (visible on mobile)
        .space-y-3(class="md:hidden")
          .glass-card.p-4.rounded-2xl.cursor-pointer(
            v-for="row in filteredPostings"
            :key="row.id"
            @click="navigateToPosting(row)"
          )
            .flex.items-start.justify-between.mb-2
              .flex.items-center.gap-3
                .w-9.h-9.rounded-xl.flex.items-center.justify-center.shrink-0(style="background: rgba(59, 130, 246, 0.15)")
                  Icon(name="ph:briefcase-bold" size="18" style="color: #3b82f6")
                div
                  p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.title }}
                  p.text-xs(style="color: var(--text-muted)") {{ row.department?.name || row.department || '--' }}
              el-tag(:type="getPostingStatusType(row.status)" effect="dark" size="small" round) {{ row.status }}
            .flex.items-center.justify-between.mt-3
              .flex.items-center.gap-4
                .flex.items-center.gap-1
                  Icon(name="ph:map-pin" size="14" style="color: var(--text-muted)")
                  span.text-xs(style="color: var(--text-muted)") {{ row.location || '--' }}
                .flex.items-center.gap-1
                  Icon(name="ph:users" size="14" style="color: #7849ff")
                  span.text-xs.font-semibold(style="color: #7849ff") {{ row.applicantCount || 0 }}
              span.text-xs(style="color: var(--text-muted)") {{ formatDate(row.createdAt) }}

        //- Empty State
        .text-center.py-12(v-if="!filteredPostings.length && !loading")
          Icon(name="ph:briefcase" size="48" style="color: var(--text-muted); opacity: 0.4")
          p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('recruitment.noPostings') || 'No job postings found. Create your first posting.' }}

        //- Pagination
        .flex.justify-end.mt-4(v-if="postingsPagination.total > postingsPagination.limit")
          el-pagination(
            :current-page="postingsPagination.page"
            :page-size="postingsPagination.limit"
            :total="postingsPagination.total"
            layout="total, prev, pager, next"
            @current-change="(p: number) => { postingsPagination.page = p; fetchPostings() }"
          )

      //- ─── Applicants Tab ─────────────────────────────────────
      el-tab-pane(:label="$t('recruitment.applicants') || 'Applicants'" name="applicants")
        //- Filters
        .flex.items-center.gap-3.mb-4.flex-wrap
          el-select(v-model="applicantStageFilter" :placeholder="$t('recruitment.allStages') || 'All Stages'" clearable size="large" style="width: 180px")
            el-option(label="All Stages" value="")
            el-option(v-for="s in APPLICANT_STAGES" :key="s.value" :label="s.label" :value="s.value")
          el-select(v-model="applicantJobFilter" :placeholder="$t('recruitment.allJobs') || 'All Jobs'" clearable size="large" style="width: 220px" filterable)
            el-option(label="All Jobs" value="")
            el-option(v-for="p in postings" :key="p.id" :label="p.title" :value="p.id")
          .flex-1
          el-input(v-model="applicantSearch" :placeholder="$t('common.search') || 'Search'" clearable style="max-width: 260px" size="large" class="!rounded-xl")
            template(#prefix)
              Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")

        //- Desktop Table
        .glass-card.rounded-2xl.overflow-hidden.hidden(class="md:block")
          el-table(:data="filteredApplicants" style="width: 100%" stripe)
            el-table-column(:label="$t('recruitment.applicantName') || 'Name'" min-width="200")
              template(#default="{ row }")
                .flex.items-center.gap-3
                  .w-9.h-9.rounded-full.flex.items-center.justify-center.shrink-0(style="background: rgba(120, 73, 255, 0.15)")
                    span.text-sm.font-bold(style="color: #7849ff") {{ (row.name || '?').charAt(0).toUpperCase() }}
                  div
                    p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.name || '--' }}
                    p.text-xs(style="color: var(--text-muted)") {{ row.email || '' }}
            el-table-column(:label="$t('recruitment.jobPosting') || 'Job Posting'" min-width="180")
              template(#default="{ row }")
                span.text-sm(style="color: var(--text-primary)") {{ row.jobPosting?.title || row.jobPostingTitle || '--' }}
            el-table-column(:label="$t('recruitment.stage') || 'Stage'" width="140" align="center")
              template(#default="{ row }")
                el-tag(:type="getStageType(row.stage)" effect="dark" size="small" round) {{ row.stage }}
            el-table-column(:label="$t('recruitment.appliedDate') || 'Applied'" width="130")
              template(#default="{ row }")
                span.text-sm(style="color: var(--text-muted)") {{ formatDate(row.createdAt) }}
            el-table-column(:label="$t('recruitment.source') || 'Source'" width="120")
              template(#default="{ row }")
                span.text-sm(style="color: var(--text-muted)") {{ row.source || '--' }}
            el-table-column(:label="$t('recruitment.rating') || 'Rating'" width="130" align="center")
              template(#default="{ row }")
                el-rate(:model-value="row.rating || 0" disabled :max="5" size="small")
            el-table-column(:label="$t('common.actions') || 'Actions'" width="160" align="center")
              template(#default="{ row }")
                .flex.items-center.justify-center.gap-1
                  el-tooltip(:content="$t('recruitment.moveStage') || 'Move Stage'" placement="top")
                    el-button(text type="success" size="small" @click.stop="openStageDialog(row)")
                      Icon(name="ph:arrow-right-bold" size="16")
                  el-tooltip(:content="$t('common.edit') || 'Edit'" placement="top")
                    el-button(text type="primary" size="small" @click.stop="openApplicantDialog(row)")
                      Icon(name="ph:pencil-bold" size="16")
                  el-tooltip(:content="$t('recruitment.reject') || 'Reject'" placement="top")
                    el-button(v-if="row.stage !== 'REJECTED' && row.stage !== 'HIRED'" text type="danger" size="small" @click.stop="handleRejectApplicant(row)")
                      Icon(name="ph:x-circle-bold" size="16")

        //- Mobile Cards
        .space-y-3(class="md:hidden")
          .glass-card.p-4.rounded-2xl(v-for="row in filteredApplicants" :key="row.id")
            .flex.items-start.justify-between.mb-2
              .flex.items-center.gap-3
                .w-9.h-9.rounded-full.flex.items-center.justify-center.shrink-0(style="background: rgba(120, 73, 255, 0.15)")
                  span.text-sm.font-bold(style="color: #7849ff") {{ (row.name || '?').charAt(0).toUpperCase() }}
                div
                  p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.name }}
                  p.text-xs(style="color: var(--text-muted)") {{ row.email }}
              el-tag(:type="getStageType(row.stage)" effect="dark" size="small" round) {{ row.stage }}
            .flex.items-center.justify-between.mt-3
              span.text-xs(style="color: var(--text-muted)") {{ row.jobPosting?.title || '--' }}
              .flex.items-center.gap-2
                el-button(text type="success" size="small" @click.stop="openStageDialog(row)")
                  Icon(name="ph:arrow-right-bold" size="14")
                el-button(text type="primary" size="small" @click.stop="openApplicantDialog(row)")
                  Icon(name="ph:pencil-bold" size="14")

        //- Empty State
        .text-center.py-12(v-if="!filteredApplicants.length && !loading")
          Icon(name="ph:user-circle" size="48" style="color: var(--text-muted); opacity: 0.4")
          p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('recruitment.noApplicants') || 'No applicants found.' }}

        //- Pagination
        .flex.justify-end.mt-4(v-if="applicantsPagination.total > applicantsPagination.limit")
          el-pagination(
            :current-page="applicantsPagination.page"
            :page-size="applicantsPagination.limit"
            :total="applicantsPagination.total"
            layout="total, prev, pager, next"
            @current-change="(p: number) => { applicantsPagination.page = p; fetchApplicants() }"
          )

  //- ─── Job Posting Dialog ─────────────────────────────────
  el-dialog(
    v-model="postingDialogVisible"
    :title="editingPosting ? ($t('recruitment.editPosting') || 'Edit Job Posting') : ($t('recruitment.newPosting') || 'New Job Posting')"
    width="640px"
    destroy-on-close
  )
    el-form(:model="postingForm" label-position="top")
      el-form-item(:label="$t('recruitment.jobTitle') || 'Job Title'" required)
        el-input(v-model="postingForm.title" :placeholder="$t('recruitment.jobTitlePlaceholder') || 'e.g., Senior Frontend Developer'")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('recruitment.department') || 'Department'")
          el-select(v-model="postingForm.departmentId" class="w-full" filterable allow-create :placeholder="$t('recruitment.selectDepartment') || 'Select department'")
            el-option(v-for="dept in departments" :key="dept.id || dept" :label="dept.name || dept" :value="dept.id || dept")
        el-form-item(:label="$t('recruitment.location') || 'Location'")
          el-input(v-model="postingForm.location" :placeholder="$t('recruitment.locationPlaceholder') || 'e.g., Riyadh, Remote'")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('recruitment.type') || 'Employment Type'")
          el-select(v-model="postingForm.type" class="w-full")
            el-option(label="Full-time" value="FULL_TIME")
            el-option(label="Part-time" value="PART_TIME")
            el-option(label="Contract" value="CONTRACT")
            el-option(label="Internship" value="INTERNSHIP")
        el-form-item(:label="$t('recruitment.status') || 'Status'")
          el-select(v-model="postingForm.status" class="w-full")
            el-option(v-for="s in POSTING_STATUSES" :key="s.value" :label="s.label" :value="s.value")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-3")
        el-form-item(:label="$t('recruitment.openPositions') || 'Open Positions'")
          el-input-number(v-model="postingForm.openPositions" :min="1" :max="100" class="w-full")
        el-form-item(:label="$t('recruitment.salaryMin') || 'Salary Min'")
          el-input-number(v-model="postingForm.salaryMin" :min="0" :step="1000" class="w-full" :controls="false")
        el-form-item(:label="$t('recruitment.salaryMax') || 'Salary Max'")
          el-input-number(v-model="postingForm.salaryMax" :min="0" :step="1000" class="w-full" :controls="false")
      el-form-item(:label="$t('recruitment.closingDate') || 'Closing Date'")
        el-date-picker(v-model="postingForm.closingDate" type="date" :placeholder="$t('recruitment.selectDate') || 'Select date'" class="w-full")
      el-form-item(:label="$t('recruitment.description') || 'Job Description'")
        el-input(v-model="postingForm.description" type="textarea" :rows="4" :placeholder="$t('recruitment.descriptionPlaceholder') || 'Enter job description...'")
      el-form-item(:label="$t('recruitment.requirements') || 'Requirements'")
        .space-y-2
          .flex.items-center.gap-2(v-for="(req, idx) in postingForm.requirements" :key="idx")
            el-input(v-model="postingForm.requirements[idx]" :placeholder="$t('recruitment.requirementPlaceholder') || 'e.g., 5+ years of experience'")
            el-button(text type="danger" @click="postingForm.requirements.splice(idx, 1)")
              Icon(name="ph:x-bold" size="14")
          el-button(text type="primary" @click="postingForm.requirements.push('')")
            Icon(name="ph:plus-bold" size="14")
            span.ml-1 {{ $t('recruitment.addRequirement') || 'Add Requirement' }}
    template(#footer)
      el-button(@click="postingDialogVisible = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" @click="handleSavePosting" :loading="saving") {{ $t('common.save') || 'Save' }}

  //- ─── Applicant Dialog ───────────────────────────────────
  el-dialog(
    v-model="applicantDialogVisible"
    :title="editingApplicant ? ($t('recruitment.editApplicant') || 'Edit Applicant') : ($t('recruitment.newApplicant') || 'New Applicant')"
    width="600px"
    destroy-on-close
  )
    el-form(:model="applicantForm" label-position="top")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('recruitment.applicantName') || 'Full Name'" required)
          el-input(v-model="applicantForm.name" :placeholder="$t('recruitment.namePlaceholder') || 'Enter full name'")
        el-form-item(:label="$t('recruitment.email') || 'Email'" required)
          el-input(v-model="applicantForm.email" type="email" :placeholder="$t('recruitment.emailPlaceholder') || 'Enter email'")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('recruitment.phone') || 'Phone'")
          el-input(v-model="applicantForm.phone" :placeholder="$t('recruitment.phonePlaceholder') || 'Enter phone number'")
        el-form-item(:label="$t('recruitment.jobPosting') || 'Job Posting'" required)
          el-select(v-model="applicantForm.jobPostingId" class="w-full" filterable :placeholder="$t('recruitment.selectPosting') || 'Select job posting'")
            el-option(v-for="p in postings" :key="p.id" :label="p.title" :value="p.id")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('recruitment.source') || 'Source'")
          el-select(v-model="applicantForm.source" class="w-full" filterable allow-create :placeholder="$t('recruitment.selectSource') || 'Select source'")
            el-option(label="LinkedIn" value="LinkedIn")
            el-option(label="Indeed" value="Indeed")
            el-option(label="Referral" value="Referral")
            el-option(label="Website" value="Website")
            el-option(label="Job Board" value="Job Board")
            el-option(label="Other" value="Other")
        el-form-item(:label="$t('recruitment.rating') || 'Rating'")
          el-rate(v-model="applicantForm.rating" :max="5" allow-half)
      el-form-item(:label="$t('recruitment.notes') || 'Notes'")
        el-input(v-model="applicantForm.notes" type="textarea" :rows="3" :placeholder="$t('recruitment.notesPlaceholder') || 'Add notes about the applicant...'")
    template(#footer)
      el-button(@click="applicantDialogVisible = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" @click="handleSaveApplicant" :loading="saving") {{ $t('common.save') || 'Save' }}

  //- ─── Move Stage Dialog ──────────────────────────────────
  el-dialog(
    v-model="stageDialogVisible"
    :title="$t('recruitment.moveStage') || 'Move Applicant Stage'"
    width="420px"
    destroy-on-close
  )
    div(v-if="stageApplicant")
      .flex.items-center.gap-3.mb-4
        .w-10.h-10.rounded-full.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
          span.text-sm.font-bold(style="color: #7849ff") {{ (stageApplicant.name || '?').charAt(0).toUpperCase() }}
        div
          p.text-sm.font-semibold(style="color: var(--text-primary)") {{ stageApplicant.name }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('recruitment.currentStage') || 'Current stage' }}: {{ stageApplicant.stage }}

      el-form-item(:label="$t('recruitment.newStage') || 'Move to Stage'")
        el-select(v-model="newStage" class="w-full" size="large")
          el-option(
            v-for="s in availableStages"
            :key="s.value"
            :label="s.label"
            :value="s.value"
            :disabled="s.disabled"
          )
    template(#footer)
      el-button(@click="stageDialogVisible = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" @click="handleMoveStage" :loading="saving" :disabled="!newStage") {{ $t('recruitment.moveStage') || 'Move' }}
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({ middleware: 'permissions' });

const router = useRouter();
const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(false);
const saving = ref(false);
const activeTab = ref('postings');

// ─── Postings State ──────────────────────────────────────
const postingDialogVisible = ref(false);
const editingPosting = ref<any>(null);
const postingSearch = ref('');
const postingStatusFilter = ref('');
const postings = ref<any[]>([]);
const postingsPagination = reactive({ page: 1, limit: 20, total: 0 });

// ─── Applicants State ────────────────────────────────────
const applicantDialogVisible = ref(false);
const editingApplicant = ref<any>(null);
const applicantSearch = ref('');
const applicantStageFilter = ref('');
const applicantJobFilter = ref<string | number>('');
const applicants = ref<any[]>([]);
const applicantsPagination = reactive({ page: 1, limit: 20, total: 0 });

// ─── Stage Move State ────────────────────────────────────
const stageDialogVisible = ref(false);
const stageApplicant = ref<any>(null);
const newStage = ref('');

// ─── Misc ────────────────────────────────────────────────
const departments = ref<any[]>([]);

const POSTING_STATUSES = [
  { value: 'OPEN', label: 'Open' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ON_HOLD', label: 'On Hold' }
];

const APPLICANT_STAGES = [
  { value: 'APPLIED', label: 'Applied' },
  { value: 'SCREENING', label: 'Screening' },
  { value: 'INTERVIEW', label: 'Interview' },
  { value: 'ASSESSMENT', label: 'Assessment' },
  { value: 'OFFER', label: 'Offer' },
  { value: 'HIRED', label: 'Hired' },
  { value: 'REJECTED', label: 'Rejected' }
];

const STAGE_ORDER = ['APPLIED', 'SCREENING', 'INTERVIEW', 'ASSESSMENT', 'OFFER', 'HIRED'];

// ─── Forms ───────────────────────────────────────────────
const defaultPostingForm = () => ({
  title: '',
  departmentId: '' as string | number,
  location: '',
  status: 'OPEN',
  type: 'FULL_TIME',
  openPositions: 1,
  salaryMin: null as number | null,
  salaryMax: null as number | null,
  closingDate: '',
  description: '',
  requirements: [''] as string[]
});

const defaultApplicantForm = () => ({
  name: '',
  email: '',
  phone: '',
  jobPostingId: '' as string | number,
  source: '',
  rating: 0,
  notes: ''
});

const postingForm = reactive(defaultPostingForm());
const applicantForm = reactive(defaultApplicantForm());

// ─── KPI Stats ───────────────────────────────────────────
const kpiStats = computed(() => {
  const openPositions = postings.value.filter(p => p.status === 'OPEN').length;
  const totalApplicants = applicantsPagination.total || applicants.value.length;
  const inInterview = applicants.value.filter(a => a.stage === 'INTERVIEW' || a.stage === 'ASSESSMENT').length;
  const hiredThisMonth = applicants.value.filter(a => {
    if (a.stage !== 'HIRED') return false;
    const d = new Date(a.updatedAt || a.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  return [
    { label: t('recruitment.openPositions') || 'Open Positions', value: openPositions, icon: 'ph:briefcase-bold', color: '#3b82f6' },
    { label: t('recruitment.totalApplicants') || 'Total Applicants', value: totalApplicants, icon: 'ph:users-bold', color: '#7849ff' },
    { label: t('recruitment.interviewsScheduled') || 'Interviews Scheduled', value: inInterview, icon: 'ph:video-camera-bold', color: '#f59e0b' },
    { label: t('recruitment.hiresThisMonth') || 'Hires This Month', value: hiredThisMonth, icon: 'ph:user-circle-check-bold', color: '#22c55e' }
  ];
});

// ─── Computed Filters ────────────────────────────────────
const filteredPostings = computed(() => {
  let data = postings.value;
  if (postingStatusFilter.value) {
    data = data.filter(p => p.status === postingStatusFilter.value);
  }
  if (postingSearch.value) {
    const q = postingSearch.value.toLowerCase();
    data = data.filter(p =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.department?.name || '').toLowerCase().includes(q) ||
      (p.location || '').toLowerCase().includes(q)
    );
  }
  return data;
});

const filteredApplicants = computed(() => {
  let data = applicants.value;
  if (applicantStageFilter.value) {
    data = data.filter(a => a.stage === applicantStageFilter.value);
  }
  if (applicantJobFilter.value) {
    data = data.filter(a => a.jobPostingId == applicantJobFilter.value);
  }
  if (applicantSearch.value) {
    const q = applicantSearch.value.toLowerCase();
    data = data.filter(a =>
      (a.name || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q) ||
      (a.jobPosting?.title || '').toLowerCase().includes(q)
    );
  }
  return data;
});

const availableStages = computed(() => {
  if (!stageApplicant.value) return [];
  const current = stageApplicant.value.stage;
  const currentIdx = STAGE_ORDER.indexOf(current);

  return APPLICANT_STAGES.map(s => {
    const idx = STAGE_ORDER.indexOf(s.value);
    let disabled = false;
    if (s.value === current) disabled = true;
    if (s.value !== 'REJECTED' && idx >= 0 && currentIdx >= 0 && idx <= currentIdx) disabled = true;
    if (current === 'HIRED') disabled = true;
    if (current === 'REJECTED' && s.value !== 'APPLIED') disabled = true;
    return { ...s, disabled };
  });
});

// ─── Helpers ─────────────────────────────────────────────
function getPostingStatusType(status: string): string {
  const map: Record<string, string> = { OPEN: 'success', CLOSED: 'danger', DRAFT: 'info', ON_HOLD: 'warning', FILLED: 'success' };
  return map[status] || 'info';
}

function getStageType(stage: string): string {
  const map: Record<string, string> = {
    APPLIED: 'info', SCREENING: '', INTERVIEW: 'warning',
    ASSESSMENT: '', OFFER: 'success', HIRED: 'success', REJECTED: 'danger'
  };
  return map[stage] || 'info';
}

function formatDate(d: string) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatType(type: string) {
  const map: Record<string, string> = {
    FULL_TIME: 'Full-time', PART_TIME: 'Part-time', CONTRACT: 'Contract', INTERNSHIP: 'Internship'
  };
  return map[type] || type || '--';
}

function navigateToPosting(row: any) {
  if (row?.id) router.push(`/hr/recruitment/${row.id}`);
}

// ─── Data Fetching ───────────────────────────────────────
async function fetchPostings() {
  try {
    const params = `page=${postingsPagination.page}&limit=${postingsPagination.limit}`;
    const res = await useApiFetch(`hr/recruitment/postings?${params}`);
    if (res?.success && res.body) {
      const data = res.body as any;
      postings.value = (data.docs || data.rows || data || []).map((p: any) => ({
        ...p,
        applicantCount: p.applicants?.length ?? p.applicantCount ?? 0
      }));
      if (data.pagination) {
        postingsPagination.total = data.pagination.totalItems ?? 0;
      } else {
        postingsPagination.total = data.count ?? data.total ?? postings.value.length;
      }
    }
  } catch {
    ElMessage.error(t('common.error') || 'Failed to load postings');
  }
}

async function fetchApplicants() {
  try {
    const params = `page=${applicantsPagination.page}&limit=${applicantsPagination.limit}`;
    const res = await useApiFetch(`hr/recruitment/applicants?${params}`);
    if (res?.success && res.body) {
      const data = res.body as any;
      applicants.value = data.docs || data.rows || data || [];
      if (data.pagination) {
        applicantsPagination.total = data.pagination.totalItems ?? 0;
      } else {
        applicantsPagination.total = data.count ?? data.total ?? applicants.value.length;
      }
    }
  } catch {
    ElMessage.error(t('common.error') || 'Failed to load applicants');
  }
}

async function fetchDepartments() {
  try {
    const res = await useApiFetch('hr/departments?limit=100');
    if (res?.success && res.body) {
      const data = res.body as any;
      departments.value = data.docs || data.rows || data || [];
    }
  } catch {
    // Departments are supplementary
  }
}

async function loadData() {
  loading.value = true;
  try {
    await Promise.all([fetchPostings(), fetchApplicants(), fetchDepartments()]);
  } finally {
    loading.value = false;
  }
}

// ─── Posting CRUD ────────────────────────────────────────
function openPostingDialog(item?: any) {
  if (item?.id) {
    editingPosting.value = item;
    Object.assign(postingForm, {
      title: item.title || '',
      departmentId: item.departmentId || '',
      location: item.location || '',
      status: item.status || 'OPEN',
      type: item.type || 'FULL_TIME',
      openPositions: item.openPositions || 1,
      salaryMin: item.salaryMin || null,
      salaryMax: item.salaryMax || null,
      closingDate: item.closingDate || '',
      description: item.description || '',
      requirements: item.requirements?.length ? [...item.requirements] : ['']
    });
  } else {
    editingPosting.value = null;
    Object.assign(postingForm, defaultPostingForm());
  }
  postingDialogVisible.value = true;
}

async function handleSavePosting() {
  if (!postingForm.title.trim()) {
    ElMessage.warning(t('common.fillRequired') || 'Please fill in required fields');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...postingForm,
      requirements: postingForm.requirements.filter(r => r.trim())
    };
    if (editingPosting.value) {
      await useApiFetch(`hr/recruitment/postings/${editingPosting.value.id}`, 'PUT', payload);
    } else {
      await useApiFetch('hr/recruitment/postings', 'POST', payload);
    }
    postingDialogVisible.value = false;
    ElMessage.success(t('common.saved') || 'Saved successfully');
    await fetchPostings();
  } catch {
    ElMessage.error(t('common.error') || 'An error occurred');
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
    await useApiFetch(`hr/recruitment/postings/${row.id}`, 'DELETE');
    ElMessage.success(t('common.deleted') || 'Deleted successfully');
    await fetchPostings();
  } catch {
    // User cancelled
  }
}

// ─── Applicant CRUD ──────────────────────────────────────
function openApplicantDialog(item?: any) {
  if (item?.id) {
    editingApplicant.value = item;
    Object.assign(applicantForm, {
      name: item.name || '',
      email: item.email || '',
      phone: item.phone || '',
      jobPostingId: item.jobPostingId || '',
      source: item.source || '',
      rating: item.rating || 0,
      notes: item.notes || ''
    });
  } else {
    editingApplicant.value = null;
    Object.assign(applicantForm, defaultApplicantForm());
  }
  applicantDialogVisible.value = true;
}

async function handleSaveApplicant() {
  if (!applicantForm.name.trim() || !applicantForm.email.trim() || !applicantForm.jobPostingId) {
    ElMessage.warning(t('common.fillRequired') || 'Please fill in required fields');
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
    applicantDialogVisible.value = false;
    ElMessage.success(t('common.saved') || 'Saved successfully');
    await fetchApplicants();
  } catch {
    ElMessage.error(t('common.error') || 'An error occurred');
  } finally {
    saving.value = false;
  }
}

async function handleRejectApplicant(row: any) {
  try {
    await ElMessageBox.confirm(
      `${t('recruitment.confirmReject') || 'Are you sure you want to reject'} ${row.name}?`,
      t('common.warning') || 'Warning',
      { type: 'warning', confirmButtonText: t('recruitment.reject') || 'Reject' }
    );
    await useApiFetch(`hr/recruitment/applicants/${row.id}/stage`, 'PUT', { stage: 'REJECTED' });
    ElMessage.success(t('recruitment.applicantRejected') || 'Applicant rejected');
    await fetchApplicants();
  } catch {
    // User cancelled
  }
}

// ─── Stage Move ──────────────────────────────────────────
function openStageDialog(applicant: any) {
  stageApplicant.value = applicant;
  newStage.value = '';
  stageDialogVisible.value = true;
}

async function handleMoveStage() {
  if (!stageApplicant.value || !newStage.value) return;
  saving.value = true;
  try {
    const res = await useApiFetch(`hr/recruitment/applicants/${stageApplicant.value.id}/stage`, 'PUT', { stage: newStage.value });
    if (res?.success) {
      ElMessage.success(`${t('recruitment.stageMoved') || 'Moved to'} ${newStage.value}`);
      stageDialogVisible.value = false;
      await fetchApplicants();
    } else {
      ElMessage.error(res?.message || t('common.error') || 'Failed to move stage');
    }
  } catch {
    ElMessage.error(t('common.error') || 'An error occurred');
  } finally {
    saving.value = false;
  }
}

// ─── Init ────────────────────────────────────────────────
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
