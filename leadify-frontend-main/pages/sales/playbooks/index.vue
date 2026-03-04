<template lang="pug">
.playbooks-page.p-8.animate-entrance
  //- Header
  .flex.items-center.justify-between.mb-8
    div
      h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('playbooks.title') }}
      p(style="color: var(--text-muted)") {{ $t('playbooks.subtitle') }}
    .flex.items-center.gap-3
      el-button(type="primary" size="large" @click="openCreateDialog" class="!rounded-2xl premium-btn")
        Icon.mr-1(name="ph:plus-bold" size="18")
        | {{ $t('playbooks.createPlaybook') }}

  //- Stats Cards
  .grid.gap-4.mb-8(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-4")
    .stat-card.glass-card.p-5
      .flex.items-center.gap-4
        .stat-icon(style="background: rgba(120, 73, 255, 0.12)")
          Icon(name="ph:book-open-bold" size="24" style="color: #7849ff")
        div
          p.text-xs.font-semibold.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('playbooks.totalPlaybooks') }}
          p.text-2xl.font-bold(style="color: var(--text-primary)") {{ playbooks.length }}

    .stat-card.glass-card.p-5
      .flex.items-center.gap-4
        .stat-icon(style="background: rgba(34, 197, 94, 0.12)")
          Icon(name="ph:check-circle-bold" size="24" style="color: #22c55e")
        div
          p.text-xs.font-semibold.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('playbooks.activePlaybooks') }}
          p.text-2xl.font-bold(style="color: #22c55e") {{ playbooks.filter(p => p.status === 'active').length }}

    .stat-card.glass-card.p-5
      .flex.items-center.gap-4
        .stat-icon(style="background: rgba(59, 130, 246, 0.12)")
          Icon(name="ph:users-bold" size="24" style="color: #3b82f6")
        div
          p.text-xs.font-semibold.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('playbooks.totalUsage') }}
          p.text-2xl.font-bold(style="color: #3b82f6") {{ totalUsage }}

    .stat-card.glass-card.p-5
      .flex.items-center.gap-4
        .stat-icon(style="background: rgba(245, 158, 11, 0.12)")
          Icon(name="ph:trend-up-bold" size="24" style="color: #f59e0b")
        div
          p.text-xs.font-semibold.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('playbooks.avgWinRate') }}
          p.text-2xl.font-bold(style="color: #f59e0b") {{ avgWinRate }}%

  //- Filters
  .flex.items-center.gap-3.mb-6.flex-wrap
    el-input.filter-input(
      v-model="searchQuery"
      :placeholder="$t('playbooks.searchPlaybooks')"
      prefix-icon=""
      clearable
      class="!w-64"
    )
      template(#prefix)
        Icon(name="ph:magnifying-glass-bold" size="16" style="color: var(--text-muted)")

    el-select(v-model="filterCategory" :placeholder="$t('playbooks.allCategories')" clearable class="!w-44")
      el-option(:label="$t('playbooks.allCategories')" value="")
      el-option(:label="$t('playbooks.prospecting')" value="prospecting")
      el-option(:label="$t('playbooks.discovery')" value="discovery")
      el-option(:label="$t('playbooks.closing')" value="closing")
      el-option(:label="$t('playbooks.renewal')" value="renewal")

    el-select(v-model="filterStatus" :placeholder="$t('playbooks.allStatuses')" clearable class="!w-36")
      el-option(:label="$t('playbooks.allStatuses')" value="")
      el-option(:label="$t('common.active')" value="active")
      el-option(:label="$t('playbooks.draft')" value="draft")

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  template(v-else)
    //- Playbook Grid
    .grid.gap-5(v-if="filteredPlaybooks.length" class="grid-cols-1 md:grid-cols-2 xl:grid-cols-3")
      .playbook-card.glass-card.cursor-pointer.transition-all(
        v-for="pb in filteredPlaybooks"
        :key="pb.id"
        @click="openDetail(pb)"
      )
        .p-5
          //- Card Header
          .flex.items-start.justify-between.mb-4
            .flex.items-center.gap-3
              .category-icon(:class="`category-${pb.category}`")
                Icon(:name="categoryIcon(pb.category)" size="22")
              div
                p.text-base.font-bold(style="color: var(--text-primary)") {{ pb.name }}
                p.text-xs(class="mt-0.5" style="color: var(--text-muted)") {{ pb.description?.slice(0, 60) }}{{ pb.description?.length > 60 ? '...' : '' }}
            el-tag.shrink-0(size="small" :type="pb.status === 'active' ? 'success' : 'info'" round) {{ pb.status === 'active' ? $t('common.active') : $t('playbooks.draft') }}

          //- Category Badge
          .mb-4
            el-tag(size="small" effect="plain" round) {{ $t(`playbooks.${pb.category}`) }}

          //- Meta Grid
          .grid.gap-3(class="grid-cols-2")
            .meta-item
              div(class="flex items-center gap-1.5")
                Icon(name="ph:list-numbers-bold" size="14" style="color: var(--text-muted)")
                span.text-xs(style="color: var(--text-muted)") {{ $t('playbooks.steps') }}
              p.text-sm.font-semibold(class="mt-0.5" style="color: var(--text-primary)") {{ pb.steps?.length || 0 }}

            .meta-item
              div(class="flex items-center gap-1.5")
                Icon(name="ph:clock-bold" size="14" style="color: var(--text-muted)")
                span.text-xs(style="color: var(--text-muted)") {{ $t('playbooks.duration') }}
              p.text-sm.font-semibold(class="mt-0.5" style="color: var(--text-primary)") {{ estimatedDuration(pb) }}

            .meta-item
              div(class="flex items-center gap-1.5")
                Icon(name="ph:trend-up-bold" size="14" style="color: var(--text-muted)")
                span.text-xs(style="color: var(--text-muted)") {{ $t('playbooks.winRateImprovement') }}
              p.text-sm.font-semibold(class="mt-0.5" style="color: #22c55e") +{{ pb.winRateImprovement || 0 }}%

            .meta-item
              div(class="flex items-center gap-1.5")
                Icon(name="ph:play-circle-bold" size="14" style="color: var(--text-muted)")
                span.text-xs(style="color: var(--text-muted)") {{ $t('playbooks.usageCount') }}
              p.text-sm.font-semibold(class="mt-0.5" style="color: var(--text-primary)") {{ pb.usageCount || 0 }}

          //- Last Used
          .mt-4.pt-3(style="border-top: 1px solid var(--border-glass, rgba(255,255,255,0.06))")
            .flex.items-center.justify-between
              span.text-xs(style="color: var(--text-muted)")
                Icon.mr-1(name="ph:calendar-bold" size="12" style="display: inline")
                | {{ $t('playbooks.lastUsed') }}: {{ pb.lastUsedAt ? formatDate(pb.lastUsedAt) : $t('playbooks.never') }}
              .flex.gap-1
                el-button(text circle size="small" type="primary" @click.stop="openEditDialog(pb)")
                  Icon(name="ph:pencil-simple-bold" size="14")
                el-button(text circle size="small" type="danger" @click.stop="handleDelete(pb)")
                  Icon(name="ph:trash-bold" size="14")

    //- Empty State
    .text-center.py-16(v-else)
      .empty-icon.mx-auto.mb-4
        Icon(name="ph:book-open-bold" size="56" style="color: var(--text-muted); opacity: 0.4")
      p.text-lg.font-semibold.mb-2(style="color: var(--text-primary)") {{ $t('playbooks.noPlaybooks') }}
      p.text-sm.mb-6(style="color: var(--text-muted)") {{ $t('playbooks.noPlaybooksDesc') }}
      el-button(type="primary" size="large" @click="openCreateDialog" class="!rounded-2xl premium-btn")
        Icon.mr-1(name="ph:plus-bold" size="18")
        | {{ $t('playbooks.createFirst') }}

  //- Playbook Detail Drawer
  el-drawer(
    v-model="detailVisible"
    :title="detailPlaybook?.name || ''"
    size="680px"
    direction="rtl"
  )
    template(v-if="detailPlaybook")
      //- Detail Header
      .px-2.mb-6
        .flex.items-center.gap-3.mb-3
          el-tag(size="small" :type="detailPlaybook.status === 'active' ? 'success' : 'info'" round) {{ detailPlaybook.status === 'active' ? $t('common.active') : $t('playbooks.draft') }}
          el-tag(size="small" effect="plain" round) {{ $t(`playbooks.${detailPlaybook.category}`) }}
        p.text-sm.mb-4(style="color: var(--text-muted)") {{ detailPlaybook.description }}

        //- Quick Stats
        .grid.gap-3.mb-6(class="grid-cols-3")
          .glass-card.p-3.text-center
            p.text-xs.mb-1(style="color: var(--text-muted)") {{ $t('playbooks.steps') }}
            p.text-lg.font-bold(style="color: #7849ff") {{ detailPlaybook.steps?.length || 0 }}
          .glass-card.p-3.text-center
            p.text-xs.mb-1(style="color: var(--text-muted)") {{ $t('playbooks.winRateImprovement') }}
            p.text-lg.font-bold(style="color: #22c55e") +{{ detailPlaybook.winRateImprovement || 0 }}%
          .glass-card.p-3.text-center
            p.text-xs.mb-1(style="color: var(--text-muted)") {{ $t('playbooks.usageCount') }}
            p.text-lg.font-bold(style="color: #3b82f6") {{ detailPlaybook.usageCount || 0 }}

        //- Progress Bar
        .mb-6(v-if="executionProgress[detailPlaybook.id]")
          .flex.items-center.justify-between.mb-2
            span.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('playbooks.executionProgress') }}
            span.text-sm(style="color: var(--text-muted)") {{ completedStepsFor(detailPlaybook) }}/{{ detailPlaybook.steps?.length || 0 }}
          el-progress(:percentage="progressPercent(detailPlaybook)" :stroke-width="8" color="#7849ff")

        //- Start / Continue Button
        .mb-6
          el-button(
            v-if="!executionProgress[detailPlaybook.id]"
            type="primary"
            size="large"
            @click="startPlaybook(detailPlaybook)"
            class="!rounded-2xl premium-btn w-full"
          )
            Icon.mr-2(name="ph:play-bold" size="18")
            | {{ $t('playbooks.startPlaybook') }}
          el-button(
            v-else
            type="success"
            size="large"
            @click="startPlaybook(detailPlaybook)"
            class="!rounded-2xl w-full"
          )
            Icon.mr-2(name="ph:arrow-right-bold" size="18")
            | {{ $t('playbooks.continuePlaybook') }}

      //- Steps Timeline
      .px-2
        h3.text-base.font-bold.mb-4(style="color: var(--text-primary)")
          Icon.mr-2(name="ph:list-numbers-bold" size="18" style="display: inline; vertical-align: middle")
          | {{ $t('playbooks.stepsTimeline') }}

        .timeline-container
          .timeline-step(
            v-for="(step, idx) in detailPlaybook.steps"
            :key="idx"
            :class="{ 'is-completed': isStepCompleted(detailPlaybook.id, idx), 'is-current': isCurrentStep(detailPlaybook.id, idx) }"
          )
            //- Timeline connector
            .timeline-connector(v-if="idx < detailPlaybook.steps.length - 1")
            //- Step node
            .timeline-node
              .node-circle(@click="toggleStepCompletion(detailPlaybook.id, idx)")
                Icon(v-if="isStepCompleted(detailPlaybook.id, idx)" name="ph:check-bold" size="14" style="color: #fff")
                span(v-else style="color: var(--text-muted); font-size: 11px; font-weight: 700") {{ idx + 1 }}

            //- Step content
            .timeline-content
              .step-header.cursor-pointer(@click="toggleStepExpand(idx)")
                .flex.items-center.gap-2
                  el-tag(size="small" :type="stepTypeColor(step.type)") {{ $t(`playbooks.${step.type}`) }}
                  span.text-sm.font-semibold(style="color: var(--text-primary)") {{ step.title }}
                .flex.items-center.gap-2
                  span.text-xs(style="color: var(--text-muted)") {{ step.durationEstimate || '—' }}
                  Icon(:name="expandedSteps.includes(idx) ? 'ph:caret-up-bold' : 'ph:caret-down-bold'" size="14" style="color: var(--text-muted)")

              //- Expanded Content
              transition(name="slide")
                .step-expanded(v-if="expandedSteps.includes(idx)")
                  p.text-sm.mt-2.mb-3(v-if="step.description" style="color: var(--text-secondary)") {{ step.description }}

                  //- Talking Points
                  .mb-3(v-if="step.talkingPoints")
                    p.text-xs.font-bold.uppercase.tracking-wider(class="mb-1.5" style="color: var(--text-muted)") {{ $t('playbooks.talkingPoints') }}
                    .talking-points-box
                      p.text-sm(style="color: var(--text-secondary); white-space: pre-wrap") {{ step.talkingPoints }}

                  //- Resources
                  .resources-section(v-if="step.resources?.length")
                    p.text-xs.font-bold.uppercase.tracking-wider(class="mb-1.5" style="color: var(--text-muted)") {{ $t('playbooks.resources') }}
                    .flex.flex-wrap.gap-2
                      el-tag(
                        v-for="(res, rIdx) in step.resources"
                        :key="rIdx"
                        size="small"
                        effect="plain"
                        round
                      )
                        Icon.mr-1(name="ph:paperclip-bold" size="12" style="display: inline")
                        | {{ res }}

  //- Create / Edit Playbook Dialog
  el-dialog(
    v-model="formDialogVisible"
    :title="isEditing ? $t('playbooks.editPlaybook') : $t('playbooks.createPlaybook')"
    width="800px"
    top="5vh"
    destroy-on-close
  )
    el-scrollbar(height="65vh")
      el-form(:model="form" label-position="top" class="px-2")
        .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
          el-form-item(:label="$t('playbooks.playbookName')" required)
            el-input(v-model="form.name" :placeholder="$t('playbooks.playbookNamePlaceholder')")

          el-form-item(:label="$t('playbooks.category')" required)
            el-select(v-model="form.category" style="width: 100%")
              el-option(:label="$t('playbooks.prospecting')" value="prospecting")
              el-option(:label="$t('playbooks.discovery')" value="discovery")
              el-option(:label="$t('playbooks.closing')" value="closing")
              el-option(:label="$t('playbooks.renewal')" value="renewal")

        el-form-item(:label="$t('playbooks.description')")
          el-input(v-model="form.description" type="textarea" :rows="3" :placeholder="$t('playbooks.descriptionPlaceholder')")

        .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
          el-form-item(:label="$t('playbooks.winRateImprovement')")
            el-input-number(v-model="form.winRateImprovement" :min="0" :max="100" style="width: 100%")

          el-form-item(:label="$t('playbooks.status')")
            el-select(v-model="form.status" style="width: 100%")
              el-option(:label="$t('common.active')" value="active")
              el-option(:label="$t('playbooks.draft')" value="draft")

        //- Steps Builder
        .steps-builder.mt-6
          .flex.items-center.justify-between.mb-4
            h3.text-base.font-bold(style="color: var(--text-primary)")
              Icon.mr-2(name="ph:list-numbers-bold" size="18" style="display: inline; vertical-align: middle")
              | {{ $t('playbooks.steps') }}
            el-button(type="primary" plain @click="addFormStep" class="!rounded-lg")
              Icon.mr-1(name="ph:plus-bold" size="14")
              | {{ $t('playbooks.addStep') }}

          //- Draggable Steps
          .space-y-3(v-if="form.steps.length")
            .step-builder-item(
              v-for="(step, idx) in form.steps"
              :key="idx"
            )
              .flex.items-center.justify-between.mb-3
                .flex.items-center.gap-2
                  .step-number {{ idx + 1 }}
                  el-tag(size="small" :type="stepTypeColor(step.type)") {{ $t(`playbooks.${step.type}`) }}
                .flex.items-center.gap-1
                  el-button(text circle size="small" @click="moveStep(idx, -1)" :disabled="idx === 0")
                    Icon(name="ph:arrow-up-bold" size="14")
                  el-button(text circle size="small" @click="moveStep(idx, 1)" :disabled="idx === form.steps.length - 1")
                    Icon(name="ph:arrow-down-bold" size="14")
                  el-button(text circle size="small" type="danger" @click="removeFormStep(idx)")
                    Icon(name="ph:trash-bold" size="14")

              .grid.gap-3(class="grid-cols-1 md:grid-cols-3")
                el-form-item(:label="$t('playbooks.stepTitle')" class="!mb-0")
                  el-input(v-model="step.title" size="default")

                el-form-item(:label="$t('playbooks.stepType')" class="!mb-0")
                  el-select(v-model="step.type" style="width: 100%")
                    el-option(:label="$t('playbooks.call')" value="call")
                    el-option(:label="$t('playbooks.email')" value="email")
                    el-option(:label="$t('playbooks.meeting')" value="meeting")
                    el-option(:label="$t('playbooks.task')" value="task")
                    el-option(:label="$t('playbooks.wait')" value="wait")

                el-form-item(:label="$t('playbooks.duration')" class="!mb-0")
                  el-input(v-model="step.durationEstimate" :placeholder="$t('playbooks.durationPlaceholder')" size="default")

              el-form-item.mt-2(:label="$t('playbooks.description')" class="!mb-0")
                el-input(v-model="step.description" type="textarea" :rows="2")

              el-form-item.mt-2(:label="$t('playbooks.talkingPoints')" class="!mb-0")
                el-input(v-model="step.talkingPoints" type="textarea" :rows="3" :placeholder="$t('playbooks.talkingPointsPlaceholder')")

              el-form-item.mt-2(:label="$t('playbooks.resources')" class="!mb-0")
                el-select(
                  v-model="step.resources"
                  multiple
                  filterable
                  allow-create
                  default-first-option
                  :placeholder="$t('playbooks.resourcesPlaceholder')"
                  style="width: 100%"
                )

          .text-center.py-8(v-else)
            Icon(name="ph:stack-bold" size="40" style="color: var(--text-muted); opacity: 0.4")
            p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('playbooks.noStepsYet') }}

    template(#footer)
      el-button(@click="formDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleSave" :loading="saving" class="!rounded-xl") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElNotification, ElMessageBox } from 'element-plus';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({ layout: 'default', title: 'Sales Playbooks' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

// ── State ──
const loading = ref(true);
const saving = ref(false);
const searchQuery = ref('');
const filterCategory = ref('');
const filterStatus = ref('');
const formDialogVisible = ref(false);
const detailVisible = ref(false);
const isEditing = ref(false);
const editingId = ref('');
const expandedSteps = ref<number[]>([]);
const detailPlaybook = ref<any>(null);
const executionProgress = ref<Record<string, boolean[]>>({});

interface PlaybookStepForm {
  title: string;
  description: string;
  type: string;
  durationEstimate: string;
  talkingPoints: string;
  resources: string[];
}

interface PlaybookForm {
  name: string;
  description: string;
  category: string;
  status: string;
  winRateImprovement: number;
  steps: PlaybookStepForm[];
}

const form = reactive<PlaybookForm>({
  name: '',
  description: '',
  category: 'prospecting',
  status: 'active',
  winRateImprovement: 0,
  steps: []
});

const playbooks = ref<any[]>([]);

// ── Computed ──
const filteredPlaybooks = computed(() => {
  return playbooks.value.filter(pb => {
    const matchesSearch =
      !searchQuery.value ||
      pb.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      pb.description?.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesCategory = !filterCategory.value || pb.category === filterCategory.value;
    const matchesStatus = !filterStatus.value || pb.status === filterStatus.value;
    return matchesSearch && matchesCategory && matchesStatus;
  });
});

const totalUsage = computed(() => playbooks.value.reduce((sum, pb) => sum + (pb.usageCount || 0), 0));

const avgWinRate = computed(() => {
  const active = playbooks.value.filter(pb => pb.winRateImprovement);
  if (!active.length) return 0;
  return Math.round(active.reduce((sum, pb) => sum + (pb.winRateImprovement || 0), 0) / active.length);
});

// ── Load Data ──
async function loadPlaybooks() {
  loading.value = true;
  try {
    const { body, success } = await useApiFetch('playbooks');
    if (success && body) {
      const data = body as any;
      playbooks.value = data.docs || data || [];
    }
  } catch (e) {
    console.error('Failed to load playbooks', e);
    playbooks.value = [];
  } finally {
    loading.value = false;
  }
  // Load saved progress from localStorage
  try {
    const saved = localStorage.getItem('playbooks_execution_progress');
    if (saved) executionProgress.value = JSON.parse(saved);
  } catch {
    /* ignore */
  }
}

await loadPlaybooks().catch(() => {
  loading.value = false;
});

// ── Helpers ──
function categoryIcon(cat: string) {
  const map: Record<string, string> = {
    prospecting: 'ph:magnifying-glass-bold',
    discovery: 'ph:compass-bold',
    closing: 'ph:seal-check-bold',
    renewal: 'ph:arrows-clockwise-bold'
  };
  return map[cat] || 'ph:book-open-bold';
}

function stepTypeColor(type: string) {
  const map: Record<string, string> = {
    call: 'success',
    email: 'primary',
    meeting: 'warning',
    task: '',
    wait: 'info'
  };
  return (map[type] || 'info') as any;
}

function estimatedDuration(pb: any) {
  if (!pb.steps?.length) return '—';
  const total = pb.steps.reduce((sum: number, s: any) => {
    const minutes = parseInt(s.durationEstimate) || 0;
    return sum + minutes;
  }, 0);
  if (total < 60) return `${total}m`;
  return `${Math.floor(total / 60)}h ${total % 60}m`;
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
  } catch {
    return '—';
  }
}

// ── Execution Progress ──
function startPlaybook(pb: any) {
  if (!executionProgress.value[pb.id]) {
    executionProgress.value[pb.id] = new Array(pb.steps?.length || 0).fill(false);
  }
  saveProgressToStorage();
  detailVisible.value = true;
  detailPlaybook.value = pb;
}

function isStepCompleted(pbId: string, idx: number): boolean {
  return executionProgress.value[pbId]?.[idx] || false;
}

function isCurrentStep(pbId: string, idx: number): boolean {
  const progress = executionProgress.value[pbId];
  if (!progress) return idx === 0;
  // Current step is the first incomplete step
  const firstIncomplete = progress.findIndex(v => !v);
  return firstIncomplete === idx;
}

function toggleStepCompletion(pbId: string, idx: number) {
  if (!executionProgress.value[pbId]) {
    executionProgress.value[pbId] = new Array(detailPlaybook.value?.steps?.length || 0).fill(false);
  }
  executionProgress.value[pbId][idx] = !executionProgress.value[pbId][idx];
  saveProgressToStorage();
}

function completedStepsFor(pb: any): number {
  const progress = executionProgress.value[pb.id];
  if (!progress) return 0;
  return progress.filter(Boolean).length;
}

function progressPercent(pb: any): number {
  const total = pb.steps?.length || 0;
  if (!total) return 0;
  return Math.round((completedStepsFor(pb) / total) * 100);
}

function saveProgressToStorage() {
  try {
    localStorage.setItem('playbooks_execution_progress', JSON.stringify(executionProgress.value));
  } catch {
    /* ignore */
  }
}

function toggleStepExpand(idx: number) {
  const pos = expandedSteps.value.indexOf(idx);
  if (pos >= 0) expandedSteps.value.splice(pos, 1);
  else expandedSteps.value.push(idx);
}

// ── Form CRUD ──
function resetForm() {
  form.name = '';
  form.description = '';
  form.category = 'prospecting';
  form.status = 'active';
  form.winRateImprovement = 0;
  form.steps = [];
  isEditing.value = false;
  editingId.value = '';
}

function openCreateDialog() {
  resetForm();
  formDialogVisible.value = true;
}

function openEditDialog(pb: any) {
  isEditing.value = true;
  editingId.value = pb.id;
  form.name = pb.name || '';
  form.description = pb.description || '';
  form.category = pb.category || 'prospecting';
  form.status = pb.status || 'active';
  form.winRateImprovement = pb.winRateImprovement || 0;
  form.steps = (pb.steps || []).map((s: any) => ({
    title: s.title || '',
    description: s.description || '',
    type: s.type || 'call',
    durationEstimate: s.durationEstimate || '',
    talkingPoints: s.talkingPoints || '',
    resources: s.resources || []
  }));
  formDialogVisible.value = true;
}

function openDetail(pb: any) {
  detailPlaybook.value = pb;
  expandedSteps.value = [];
  detailVisible.value = true;
}

function addFormStep() {
  form.steps.push({
    title: '',
    description: '',
    type: 'call',
    durationEstimate: '',
    talkingPoints: '',
    resources: []
  });
}

function removeFormStep(idx: number) {
  form.steps.splice(idx, 1);
}

function moveStep(idx: number, dir: number) {
  const target = idx + dir;
  if (target < 0 || target >= form.steps.length) return;
  const temp = form.steps[idx]!;
  form.steps[idx] = form.steps[target]!;
  form.steps[target] = temp;
}

async function handleSave() {
  if (!form.name) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }
  saving.value = true;
  try {
    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      status: form.status,
      winRateImprovement: form.winRateImprovement,
      steps: form.steps
    };
    if (isEditing.value) {
      const { success } = await useApiFetch(`playbooks/${editingId.value}`, 'PUT', payload);
      if (success) {
        ElNotification({ type: 'success', title: t('common.success'), message: t('common.updatedSuccessfully') });
      }
    } else {
      const { success } = await useApiFetch('playbooks', 'POST', payload);
      if (success) {
        ElNotification({ type: 'success', title: t('common.success'), message: t('common.createdSuccessfully') });
      }
    }
    formDialogVisible.value = false;
    await loadPlaybooks();
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

async function handleDelete(pb: any) {
  try {
    await ElMessageBox.confirm(t('playbooks.confirmDelete'), t('common.warning'), { type: 'warning' });
    await useApiFetch(`playbooks/${pb.id}`, 'DELETE');
    playbooks.value = playbooks.value.filter(p => p.id !== pb.id);
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.deletedSuccessfully') });
  } catch {
    /* cancelled or error */
  }
}
</script>

<style lang="scss" scoped>
.playbooks-page {
  animation: fadeIn 0.5s ease-out;
}

.animate-entrance {
  animation: slideUp 0.4s ease-out;
}

.stat-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  &:hover {
    transform: translateY(-2px);
  }
}

.stat-icon {
  width: 48px;
  height: 48px;
  min-width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
}

.playbook-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
}

.category-icon {
  width: 42px;
  height: 42px;
  min-width: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;

  &.category-prospecting {
    background: rgba(120, 73, 255, 0.12);
    color: #7849ff;
  }
  &.category-discovery {
    background: rgba(59, 130, 246, 0.12);
    color: #3b82f6;
  }
  &.category-closing {
    background: rgba(34, 197, 94, 0.12);
    color: #22c55e;
  }
  &.category-renewal {
    background: rgba(245, 158, 11, 0.12);
    color: #f59e0b;
  }
}

.premium-btn {
  background: linear-gradient(135deg, #7849ff 0%, #5a2fd4 100%);
  border: none;
  color: #fff;
  font-weight: 600;
  &:hover {
    background: linear-gradient(135deg, #8b5cf6 0%, #7849ff 100%);
  }
}

// ── Timeline ──
.timeline-container {
  position: relative;
  padding-left: 24px;
}

.timeline-step {
  position: relative;
  padding-bottom: 20px;

  &:last-child {
    padding-bottom: 0;
  }
}

.timeline-connector {
  position: absolute;
  left: -12px;
  top: 32px;
  bottom: 0;
  width: 2px;
  background: var(--border-glass, rgba(255, 255, 255, 0.08));
  z-index: 0;

  .is-completed & {
    background: #7849ff;
  }
}

.timeline-node {
  position: absolute;
  left: -24px;
  top: 4px;
  z-index: 1;
}

.node-circle {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-bg, rgba(255, 255, 255, 0.04));
  border: 2px solid var(--border-glass, rgba(255, 255, 255, 0.12));
  cursor: pointer;
  transition: all 0.2s ease;

  .is-completed & {
    background: #7849ff;
    border-color: #7849ff;
  }

  .is-current & {
    border-color: #7849ff;
    box-shadow: 0 0 0 4px rgba(120, 73, 255, 0.2);
  }
}

.timeline-content {
  padding-left: 12px;
}

.step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 10px;
  transition: background 0.2s ease;

  &:hover {
    background: var(--card-bg, rgba(255, 255, 255, 0.03));
  }
}

.step-expanded {
  padding: 8px 12px;
}

.talking-points-box {
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--card-bg, rgba(255, 255, 255, 0.03));
  border-left: 3px solid #7849ff;
}

.resources-section {
  margin-top: 8px;
}

// ── Steps Builder ──
.steps-builder {
  border-top: 1px solid var(--border-glass, rgba(255, 255, 255, 0.06));
  padding-top: 16px;
}

.step-builder-item {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--border-glass, rgba(255, 255, 255, 0.08));
  background: var(--card-bg, rgba(255, 255, 255, 0.02));
  transition: border-color 0.2s ease;

  &:hover {
    border-color: rgba(120, 73, 255, 0.3);
  }
}

.step-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(120, 73, 255, 0.15);
  color: #7849ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

// ── Transitions ──
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}
.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 500px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
