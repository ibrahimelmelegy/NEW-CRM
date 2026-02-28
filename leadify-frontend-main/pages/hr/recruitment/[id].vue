<template lang="pug">
div
  //- Breadcrumb Header
  ModuleHeader(
    :title="posting?.title || $t('recruitment.postingDetail')"
    :subtitle="posting ? `${posting.department?.name || '--'} | ${formatType(posting.type)} | ${posting.location || '--'}` : ''"
    :breadcrumbs="[{ label: $t('navigation.recruitment'), to: '/hr/recruitment' }, { label: posting?.title || '...' }]"
  )
    template(#actions)
      el-button(v-if="posting?.status === 'OPEN'" size="large" type="danger" plain class="!rounded-2xl" @click="handleClosePosting")
        Icon(name="ph:lock-bold" size="16")
        span.ml-1 {{ $t('recruitment.closePosting') }}
      el-button(size="large" type="primary" class="!rounded-2xl" @click="openApplicantDialog()")
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('recruitment.addApplicant') }}

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  template(v-else-if="posting")
    //- Posting Info Card
    .glass-card.p-6.rounded-2xl.mb-6
      .grid.gap-6(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-4")
        div
          p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('recruitment.status') }}
          el-tag(:type="getPostingStatusType(posting.status)" effect="dark" size="default") {{ posting.status }}
        div
          p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('recruitment.openPositions') }}
          p.text-lg.font-bold(style="color: var(--text-primary)") {{ posting.openPositions || 1 }}
        div
          p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('recruitment.salaryRange') }}
          p.text-lg.font-bold(style="color: var(--text-primary)")
            span(v-if="posting.salaryMin || posting.salaryMax") {{ posting.salaryMin?.toLocaleString() || '0' }} - {{ posting.salaryMax?.toLocaleString() || '--' }}
            span(v-else) --
        div
          p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('recruitment.closingDate') }}
          p.text-lg.font-bold(style="color: var(--text-primary)") {{ formatDate(posting.closingDate) }}
      //- Description
      div.mt-5(v-if="posting.description")
        p.text-xs.uppercase.tracking-wider.mb-2(style="color: var(--text-muted)") {{ $t('recruitment.description') }}
        p.text-sm(style="color: var(--text-primary); line-height: 1.7; white-space: pre-line") {{ posting.description }}
      //- Requirements
      div.mt-4(v-if="posting.requirements?.length")
        p.text-xs.uppercase.tracking-wider.mb-2(style="color: var(--text-muted)") {{ $t('recruitment.requirements') }}
        ul.space-y-1.pl-4
          li.text-sm(v-for="(req, idx) in posting.requirements" :key="idx" style="color: var(--text-primary); list-style: disc") {{ req }}

    //- ─── Funnel Analytics ───────────────────────────────
    .glass-card.p-6.rounded-2xl.mb-6
      .flex.items-center.gap-2.mb-5
        Icon(name="ph:funnel-bold" size="20" style="color: #3b82f6")
        h3.text-base.font-bold(style="color: var(--text-primary)") {{ $t('recruitment.funnelAnalytics') }}

      div(v-if="funnelLoading")
        .flex.items-center.justify-center.py-8
          el-icon.is-loading(:size="24" style="color: var(--accent-color, #7849ff)")

      div(v-else-if="funnelData")
        //- Visual Bar Funnel
        .flex.items-end.gap-2.mb-6(class="flex-wrap md:flex-nowrap" style="min-height: 140px")
          .flex-1.text-center(v-for="(stage, idx) in funnelVisual" :key="stage.name" style="min-width: 70px")
            .mx-auto.rounded-t-lg.transition-all.duration-500(
              :style="{ width: funnelBarWidth(stage.count), height: funnelBarHeight(stage.count) + 'px', background: stage.color, minHeight: '28px', minWidth: '36px' }"
            )
              .text-xs.font-bold.text-white.pt-1 {{ stage.count }}
            .text-xs.font-medium.mt-2(style="color: var(--text-primary)") {{ stage.name }}
            .text-xs(v-if="idx > 0" class="mt-0.5" style="color: var(--text-muted)")
              span(v-if="funnelVisual[idx - 1].count > 0") {{ Math.round((stage.count / funnelVisual[idx - 1].count) * 100) }}%
              span(v-else) --

        //- Conversion Table
        .glass-card.rounded-xl.overflow-hidden(style="border: 1px solid var(--border-default, rgba(255,255,255,0.06))")
          el-table(:data="funnelData.conversions || []" size="small" style="width: 100%")
            el-table-column(label="From" min-width="120")
              template(#default="{ row }")
                span.text-sm.font-medium(style="color: var(--text-primary)") {{ row.from }}
            el-table-column(label="To" min-width="120")
              template(#default="{ row }")
                span.text-sm.font-medium(style="color: var(--text-primary)") {{ row.to }}
            el-table-column(label="Conversion Rate" width="160" align="center")
              template(#default="{ row }")
                .flex.items-center.justify-center.gap-2
                  el-progress(:percentage="row.rate || 0" :stroke-width="6" :show-text="false" :color="conversionColor(row.rate)" style="width: 80px")
                  span.text-sm.font-bold(:style="{ color: conversionColor(row.rate) }") {{ row.rate }}%

        //- Summary Row
        .flex.items-center.justify-between.mt-4.px-2
          .flex.items-center.gap-2
            span.text-sm(style="color: var(--text-muted)") {{ $t('recruitment.totalApplicants') }}:
            span.text-sm.font-bold(style="color: var(--text-primary)") {{ funnelData.totalApplicants || 0 }}
          .flex.items-center.gap-2
            span.text-sm(style="color: var(--text-muted)") {{ $t('recruitment.rejectionRate') }}:
            span.text-sm.font-bold(style="color: #ef4444") {{ funnelData.rejectionRate || 0 }}%

    //- ─── Applicant Pipeline View ────────────────────────
    .mb-6
      .flex.items-center.justify-between.mb-4
        .flex.items-center.gap-2
          Icon(name="ph:users-three-bold" size="20" style="color: #7849ff")
          h3.text-base.font-bold(style="color: var(--text-primary)") {{ $t('recruitment.applicantPipeline') }}
        .flex.items-center.gap-2
          el-radio-group(v-model="viewMode" size="small")
            el-radio-button(value="pipeline") {{ $t('recruitment.pipelineView') }}
            el-radio-button(value="table") {{ $t('recruitment.tableView') }}

      //- Pipeline (Kanban) View
      template(v-if="viewMode === 'pipeline'")
        .overflow-x-auto.pb-4
          .flex.gap-4(style="min-width: 1200px")
            .flex-1(v-for="stage in pipelineStages" :key="stage.value" style="min-width: 180px")
              .flex.items-center.gap-2.mb-3
                .w-3.h-3.rounded-full(:style="{ background: stage.color }")
                h4.text-sm.font-semibold(style="color: var(--text-primary)") {{ stage.label }}
                span.text-xs.px-2.rounded-full(class="py-0.5" style="background: var(--bg-elevated); color: var(--text-muted)") {{ getApplicantsForStage(stage.value).length }}
              .space-y-2(style="min-height: 100px")
                .glass-card.p-3.rounded-xl.cursor-pointer.transition-all(
                  v-for="app in getApplicantsForStage(stage.value)"
                  :key="app.id"
                  style="border-left: 3px solid; border-left-color: var(--stage-color)"
                  :style="{ '--stage-color': stage.color }"
                  @click="openApplicantPanel(app)"
                  class="hover:scale-[1.02]"
                )
                  .flex.items-center.gap-2.mb-1
                    .w-7.h-7.rounded-full.flex.items-center.justify-center.shrink-0(style="background: rgba(120, 73, 255, 0.12)")
                      span.text-xs.font-bold(style="color: #7849ff") {{ (app.name || '?').charAt(0).toUpperCase() }}
                    p.text-sm.font-semibold.truncate(style="color: var(--text-primary)") {{ app.name }}
                  p.text-xs.truncate(style="color: var(--text-muted)") {{ app.email }}
                  .flex.items-center.justify-between.mt-2
                    span.text-xs(style="color: var(--text-muted)") {{ formatDate(app.createdAt) }}
                    el-rate(:model-value="app.rating || 0" disabled :max="5" size="small" style="transform: scale(0.7); transform-origin: right center")

                //- Empty column state
                .text-center.py-6(v-if="!getApplicantsForStage(stage.value).length")
                  p.text-xs(style="color: var(--text-muted); opacity: 0.5") {{ $t('recruitment.noApplicantsInStage') }}

      //- Table View
      template(v-else)
        .glass-card.rounded-2xl.overflow-hidden
          el-table(:data="applicants" style="width: 100%" stripe)
            el-table-column(:label="$t('recruitment.applicantName')" min-width="200")
              template(#default="{ row }")
                .flex.items-center.gap-3.cursor-pointer(@click="openApplicantPanel(row)")
                  .w-8.h-8.rounded-full.flex.items-center.justify-center.shrink-0(style="background: rgba(120, 73, 255, 0.15)")
                    span.text-xs.font-bold(style="color: #7849ff") {{ (row.name || '?').charAt(0).toUpperCase() }}
                  div
                    p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.name }}
                    p.text-xs(style="color: var(--text-muted)") {{ row.email }}
            el-table-column(:label="$t('recruitment.stage')" width="140" align="center")
              template(#default="{ row }")
                el-tag(:type="getStageType(row.stage)" effect="dark" size="small" round) {{ row.stage }}
            el-table-column(:label="$t('recruitment.appliedDate')" width="130")
              template(#default="{ row }")
                span.text-sm(style="color: var(--text-muted)") {{ formatDate(row.createdAt) }}
            el-table-column(:label="$t('recruitment.source')" width="120")
              template(#default="{ row }")
                span.text-sm(style="color: var(--text-muted)") {{ row.source || '--' }}
            el-table-column(:label="$t('recruitment.rating')" width="140" align="center")
              template(#default="{ row }")
                el-rate(:model-value="row.rating || 0" disabled :max="5" size="small")
            el-table-column(:label="$t('common.actions')" width="180" align="center")
              template(#default="{ row }")
                .flex.items-center.justify-center.gap-1
                  el-button(text type="success" size="small" @click.stop="openStageDialog(row)")
                    Icon(name="ph:arrow-right-bold" size="14")
                    span.ml-1.text-xs {{ $t('recruitment.moveStage') }}
                  el-button(v-if="row.stage !== 'REJECTED' && row.stage !== 'HIRED'" text type="danger" size="small" @click.stop="handleRejectApplicant(row)")
                    Icon(name="ph:x-circle-bold" size="14")

  //- ─── Applicant Side Panel ─────────────────────────────
  el-drawer(
    v-model="panelVisible"
    :title="panelApplicant?.name || 'Applicant Details'"
    size="480px"
    direction="rtl"
  )
    template(v-if="panelApplicant")
      //- Header
      .flex.items-center.gap-4.mb-6
        .w-14.h-14.rounded-full.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
          span.text-xl.font-bold(style="color: #7849ff") {{ (panelApplicant.name || '?').charAt(0).toUpperCase() }}
        div
          h3.text-lg.font-bold(style="color: var(--text-primary)") {{ panelApplicant.name }}
          p.text-sm(style="color: var(--text-muted)") {{ panelApplicant.email }}
          p.text-sm(v-if="panelApplicant.phone" style="color: var(--text-muted)") {{ panelApplicant.phone }}

      //- Stage Badge + Actions
      .flex.items-center.gap-3.mb-6
        el-tag(:type="getStageType(panelApplicant.stage)" effect="dark" size="large") {{ panelApplicant.stage }}
        el-button(size="small" type="primary" plain @click="openStageDialog(panelApplicant)")
          Icon(name="ph:arrow-right-bold" size="14")
          span.ml-1 {{ $t('recruitment.moveStage') }}
        el-button(v-if="panelApplicant.stage !== 'REJECTED' && panelApplicant.stage !== 'HIRED'" size="small" type="danger" plain @click="handleRejectApplicant(panelApplicant)")
          Icon(name="ph:x-circle-bold" size="14")
          span.ml-1 {{ $t('recruitment.reject') }}

      //- Detail Fields
      .space-y-4
        .glass-card.p-4.rounded-xl
          .grid.gap-4(class="grid-cols-2")
            div
              p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('recruitment.appliedDate') }}
              p.text-sm.font-semibold(style="color: var(--text-primary)") {{ formatDate(panelApplicant.createdAt) }}
            div
              p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('recruitment.source') }}
              p.text-sm.font-semibold(style="color: var(--text-primary)") {{ panelApplicant.source || '--' }}
            div
              p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('recruitment.rating') }}
              el-rate(:model-value="panelApplicant.rating || 0" disabled :max="5" size="small")
            div
              p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('recruitment.resumeUrl') }}
              a.text-sm.font-semibold(v-if="panelApplicant.resumeUrl" :href="panelApplicant.resumeUrl" target="_blank" style="color: #3b82f6") {{ $t('common.view') }}
              span.text-sm(v-else style="color: var(--text-muted)") --

        //- Notes
        .glass-card.p-4.rounded-xl(v-if="panelApplicant.notes")
          p.text-xs.uppercase.tracking-wider.mb-2(style="color: var(--text-muted)") {{ $t('recruitment.notes') }}
          p.text-sm(style="color: var(--text-primary); white-space: pre-line") {{ panelApplicant.notes }}

        //- Stage History
        .glass-card.p-4.rounded-xl(v-if="panelApplicant.experience?.stageHistory?.length")
          p.text-xs.uppercase.tracking-wider.mb-3(style="color: var(--text-muted)") {{ $t('recruitment.stageHistory') }}
          .space-y-2
            .flex.items-center.gap-3(v-for="(h, idx) in panelApplicant.experience.stageHistory" :key="idx")
              .w-2.h-2.rounded-full(style="background: #7849ff")
              .flex-1.flex.items-center.justify-between
                .flex.items-center.gap-2
                  el-tag(size="small" effect="plain") {{ h.from }}
                  Icon(name="ph:arrow-right" size="12" style="color: var(--text-muted)")
                  el-tag(size="small" :type="getStageType(h.to)" effect="dark") {{ h.to }}
                span.text-xs(style="color: var(--text-muted)") {{ formatDateTime(h.timestamp) }}

  //- ─── Add Applicant Dialog ─────────────────────────────
  el-dialog(
    v-model="applicantDialogVisible"
    :title="$t('recruitment.addApplicant')"
    width="560px"
    destroy-on-close
  )
    el-form(:model="applicantForm" label-position="top")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('recruitment.applicantName')" required)
          el-input(v-model="applicantForm.name" :placeholder="$t('recruitment.namePlaceholder')")
        el-form-item(:label="$t('recruitment.email')" required)
          el-input(v-model="applicantForm.email" type="email" :placeholder="$t('recruitment.emailPlaceholder')")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('recruitment.phone')")
          el-input(v-model="applicantForm.phone" :placeholder="$t('recruitment.phonePlaceholder')")
        el-form-item(:label="$t('recruitment.source')")
          el-select(v-model="applicantForm.source" class="w-full" filterable allow-create)
            el-option(label="LinkedIn" value="LinkedIn")
            el-option(label="Indeed" value="Indeed")
            el-option(label="Referral" value="Referral")
            el-option(label="Website" value="Website")
            el-option(label="Job Board" value="Job Board")
            el-option(label="Other" value="Other")
      el-form-item(:label="$t('recruitment.notes')")
        el-input(v-model="applicantForm.notes" type="textarea" :rows="3")
    template(#footer)
      el-button(@click="applicantDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleAddApplicant" :loading="saving") {{ $t('common.save') }}

  //- ─── Move Stage Dialog ────────────────────────────────
  el-dialog(
    v-model="stageDialogVisible"
    :title="$t('recruitment.moveStage')"
    width="420px"
    destroy-on-close
  )
    div(v-if="stageApplicant")
      .flex.items-center.gap-3.mb-4
        .w-10.h-10.rounded-full.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
          span.text-sm.font-bold(style="color: #7849ff") {{ (stageApplicant.name || '?').charAt(0).toUpperCase() }}
        div
          p.text-sm.font-semibold(style="color: var(--text-primary)") {{ stageApplicant.name }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('recruitment.currentStage') }}: {{ stageApplicant.stage }}

      el-form-item(:label="$t('recruitment.newStage')")
        el-select(v-model="newStage" class="w-full" size="large")
          el-option(
            v-for="s in availableStages"
            :key="s.value"
            :label="s.label"
            :value="s.value"
            :disabled="s.disabled"
          )
    template(#footer)
      el-button(@click="stageDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleMoveStage" :loading="saving" :disabled="!newStage") {{ $t('recruitment.moveStage') }}
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({ middleware: 'permissions' });

const route = useRoute();
const { $i18n } = useNuxtApp();
const t = $i18n.t;

const postingId = computed(() => route.params.id as string);

const loading = ref(false);
const saving = ref(false);
const viewMode = ref('pipeline');

const posting = ref<any>(null);
const applicants = ref<any[]>([]);
const funnelData = ref<any>(null);
const funnelLoading = ref(false);

// Applicant panel
const panelVisible = ref(false);
const panelApplicant = ref<any>(null);

// Applicant add dialog
const applicantDialogVisible = ref(false);
const applicantForm = reactive({
  name: '',
  email: '',
  phone: '',
  source: '',
  notes: ''
});

// Stage move dialog
const stageDialogVisible = ref(false);
const stageApplicant = ref<any>(null);
const newStage = ref('');

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

const pipelineStages = [
  { value: 'APPLIED', label: 'Applied', color: '#6366f1' },
  { value: 'SCREENING', label: 'Screening', color: '#3b82f6' },
  { value: 'INTERVIEW', label: 'Interview', color: '#f59e0b' },
  { value: 'ASSESSMENT', label: 'Assessment', color: '#8b5cf6' },
  { value: 'OFFER', label: 'Offer', color: '#22c55e' },
  { value: 'HIRED', label: 'Hired', color: '#10b981' },
  { value: 'REJECTED', label: 'Rejected', color: '#ef4444' }
];

const funnelVisual = computed(() => {
  if (!funnelData.value?.funnel) return [];
  const stageColors: Record<string, string> = {
    APPLIED: '#6366f1', SCREENING: '#3b82f6', INTERVIEW: '#f59e0b',
    ASSESSMENT: '#8b5cf6', OFFER: '#22c55e', HIRED: '#10b981'
  };
  return (funnelData.value.funnel || [])
    .filter((s: any) => s.stage !== 'REJECTED')
    .map((s: any) => ({
      name: s.stage,
      count: s.count,
      color: stageColors[s.stage] || '#6b7280'
    }));
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
  const map: Record<string, string> = { OPEN: 'success', CLOSED: 'danger', DRAFT: 'info', ON_HOLD: 'warning' };
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

function formatDateTime(d: string) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatType(type: string) {
  const map: Record<string, string> = { FULL_TIME: 'Full-time', PART_TIME: 'Part-time', CONTRACT: 'Contract', INTERNSHIP: 'Internship' };
  return map[type] || type || '--';
}

function getApplicantsForStage(stage: string) {
  return applicants.value.filter(a => a.stage === stage);
}

function funnelBarWidth(count: number): string {
  const max = Math.max(...funnelVisual.value.map((s: any) => s.count), 1);
  return Math.max(36, Math.round((count / max) * 100)) + '%';
}

function funnelBarHeight(count: number): number {
  const max = Math.max(...funnelVisual.value.map((s: any) => s.count), 1);
  return Math.max(28, Math.round((count / max) * 120));
}

function conversionColor(rate: number): string {
  if (rate >= 60) return '#22c55e';
  if (rate >= 30) return '#f59e0b';
  return '#ef4444';
}

// ─── Data Fetching ───────────────────────────────────────
async function fetchPosting() {
  try {
    const res = await useApiFetch(`hr/recruitment/postings?page=1&limit=100`);
    if (res?.success && res.body) {
      const data = res.body as any;
      const all = data.docs || data.rows || data || [];
      posting.value = all.find((p: any) => String(p.id) === String(postingId.value)) || null;
    }
  } catch {
    ElMessage.error(t('recruitment.loadPostingFailed'));
  }
}

async function fetchApplicants() {
  try {
    const res = await useApiFetch(`hr/recruitment/applicants?jobPostingId=${postingId.value}&limit=200`);
    if (res?.success && res.body) {
      const data = res.body as any;
      applicants.value = data.docs || data.rows || data || [];
    }
  } catch {
    ElMessage.error(t('recruitment.loadApplicantsFailed'));
  }
}

async function fetchFunnel() {
  funnelLoading.value = true;
  try {
    const res = await useApiFetch(`hr/recruitment/postings/${postingId.value}/funnel`);
    if (res?.success && res.body) {
      funnelData.value = res.body;
    }
  } catch {
    // Funnel is supplementary
  } finally {
    funnelLoading.value = false;
  }
}

async function loadAll() {
  loading.value = true;
  try {
    await Promise.all([fetchPosting(), fetchApplicants(), fetchFunnel()]);
  } finally {
    loading.value = false;
  }
}

// ─── Applicant Panel ─────────────────────────────────────
function openApplicantPanel(app: any) {
  panelApplicant.value = app;
  panelVisible.value = true;
}

// ─── Add Applicant ───────────────────────────────────────
function openApplicantDialog() {
  applicantForm.name = '';
  applicantForm.email = '';
  applicantForm.phone = '';
  applicantForm.source = '';
  applicantForm.notes = '';
  applicantDialogVisible.value = true;
}

async function handleAddApplicant() {
  if (!applicantForm.name.trim() || !applicantForm.email.trim()) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...applicantForm,
      jobPostingId: Number(postingId.value),
      stage: 'APPLIED'
    };
    const res = await useApiFetch('hr/recruitment/applicants', 'POST', payload);
    if (res?.success) {
      ElMessage.success(t('common.saved'));
      applicantDialogVisible.value = false;
      await Promise.all([fetchApplicants(), fetchFunnel()]);
    } else {
      ElMessage.error(res?.message || t('common.error'));
    }
  } catch {
    ElMessage.error(t('common.error'));
  } finally {
    saving.value = false;
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
      ElMessage.success(`Moved to ${newStage.value}`);
      stageDialogVisible.value = false;
      panelVisible.value = false;
      await Promise.all([fetchApplicants(), fetchFunnel()]);
    } else {
      ElMessage.error(res?.message || t('common.error'));
    }
  } catch {
    ElMessage.error(t('common.error'));
  } finally {
    saving.value = false;
  }
}

async function handleRejectApplicant(row: any) {
  try {
    await ElMessageBox.confirm(
      `${t('recruitment.confirmReject')} ${row.name}?`,
      t('common.warning'),
      { type: 'warning' }
    );
    await useApiFetch(`hr/recruitment/applicants/${row.id}/stage`, 'PUT', { stage: 'REJECTED' });
    ElMessage.success(t('recruitment.applicantRejected'));
    panelVisible.value = false;
    await Promise.all([fetchApplicants(), fetchFunnel()]);
  } catch {
    // User cancelled
  }
}

async function handleClosePosting() {
  try {
    await ElMessageBox.confirm(
      t('recruitment.confirmClosePosting'),
      t('common.warning'),
      { type: 'warning', confirmButtonText: t('recruitment.closePosting') }
    );
    const res = await useApiFetch(`hr/recruitment/postings/${postingId.value}/close`, 'PUT', { rejectRemaining: true });
    if (res?.success) {
      ElMessage.success(t('recruitment.postingClosed'));
      await loadAll();
    } else {
      ElMessage.error(res?.message || t('common.error'));
    }
  } catch {
    // User cancelled
  }
}

// ─── Init ────────────────────────────────────────────────
onMounted(() => {
  loadAll();
});
</script>

<style lang="scss" scoped>
.glass-card {
  background: var(--bg-elevated, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--border-default, rgba(255, 255, 255, 0.08));
  border-radius: 16px;
}
</style>
