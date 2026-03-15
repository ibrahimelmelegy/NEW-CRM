<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-6
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") {{ $t('kanbanBoard.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('kanbanBoard.subtitle') }}
    .flex.items-center.gap-3
      //- Toggle between Deal and Opportunity kanban
      el-segmented(v-model="viewMode" :options="viewOptions" @change="onViewChange" size="default")
      //- Advanced Filters
      .flex.items-center.gap-2
        el-select(v-model="filters.assignee" :placeholder="$t('kanbanBoard.allAssignees')" clearable size="default" style="width: 160px" @change="fetchData")
          el-option(v-for="user in assignees" :key="user.value" :label="user.label" :value="user.value")
        el-date-picker(v-model="filters.dateRange" type="daterange" range-separator="-" :start-placeholder="$t('common.startDate')" :end-placeholder="$t('common.endDate')" size="default" @change="fetchData" style="width: 240px")
        el-select(v-model="filters.priority" :placeholder="$t('kanbanBoard.allPriorities')" clearable size="default" style="width: 140px" @change="fetchData")
          el-option(:label="$t('common.low')" value="low")
          el-option(:label="$t('common.medium')" value="medium")
          el-option(:label="$t('common.high')" value="high")
      el-button(type="primary" size="default" @click="addCard" style="background: var(--bg-obsidian); border: none; border-radius: 12px;" :disabled="viewMode === 'opportunity'")
        Icon(name="ph:plus" size="16" style="margin-right: 4px;")
        | {{ $t('kanbanBoard.addItem') }}

  //- Kanban Columns
  .flex.gap-5.overflow-x-auto.pb-6(v-loading="loading" style="min-height: 70vh;")
    .flex-shrink-0.w-80(v-for="col in columns" :key="col.id")
      //- Column Header
      .flex.items-center.justify-between.px-4.py-3.rounded-t-2xl(:style="{ background: col.color + '15', borderBottom: `3px solid ${col.color}` }")
        .flex.items-center.gap-2
          .w-3.h-3.rounded-full(:style="{ backgroundColor: col.color }")
          span.font-bold.text-sm {{ col.title }}
        el-badge(:value="getColumnCards(col.id).length" type="info")

      //- Cards Container
      div(class="space-y-3 p-3 rounded-b-2xl min-h-[200px]" style="background: var(--bg-elevated); border: 1px solid var(--border-default); border-top: none;")
        .p-4.rounded-xl.border.cursor-grab.transition-all(
          v-for="card in getColumnCards(col.id)"
          :key="card.id"
          style="background: white; border-color: var(--border-default);"
          class="hover:shadow-md hover:border-violet-200"
          draggable="true"
          @dragstart="dragStart(card)"
          @dragend="dragEnd"
        )
          .flex.items-center.justify-between.mb-2
            span.text-xs.font-mono.font-bold(style="color: var(--text-muted);") {{ card.ref }}
            el-tag(v-if="card.priority" size="small" round :type="priorityTag(card.priority)") {{ card.priority }}
          p.text-sm.font-bold(style="color: var(--text-primary);") {{ card.title }}
          p.text-xs.mt-1.line-clamp-2(v-if="card.description" style="color: var(--text-muted);") {{ card.description }}
          .flex.items-center.justify-between.mt-3
            .flex.items-center.gap-1
              Icon(name="ph:user" size="12" style="color: var(--text-muted);")
              span.text-xs(style="color: var(--text-muted);") {{ card.assignee || $t('kanbanBoard.unassigned') }}
            span.text-xs.font-mono(style="color: var(--text-muted);") {{ card.value?.toLocaleString() || '—' }}
          .flex.items-center.gap-1.mt-2
            el-button(
              v-for="targetCol in columns.filter(c => c.id !== col.id)"
              :key="targetCol.id"
              text
              size="small"
              @click="moveCard(card.id, targetCol.id)"
            )
              span.text-xs → {{ targetCol.title.split(' ')[0] }}

        //- Drop zone
        .p-6.rounded-xl.border-2.border-dashed.text-center.text-xs.transition-colors(
          style="border-color: var(--border-default); color: var(--text-muted);"
          @dragover.prevent
          @drop="dropCard(col.id)"
          class="hover:border-violet-300 hover:bg-violet-50/30"
        ) {{ $t('kanbanBoard.dropHere') }}

  //- Add Card Dialog (only for deals)
  el-dialog(v-model="showDialog" :title="$t('kanbanBoard.addItem')" width="480px")
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('kanbanBoard.cardTitle')")
        el-input(v-model="form.title" :placeholder="$t('kanbanBoard.cardTitlePlaceholder')")
      el-form-item(:label="$t('kanbanBoard.description')")
        el-input(v-model="form.description" type="textarea" :rows="2")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('kanbanBoard.stage')")
          el-select(v-model="form.columnId" class="w-full")
            el-option(v-for="col in columns" :key="col.id" :label="col.title" :value="col.id")
        el-form-item(:label="$t('kanbanBoard.priority')")
          el-select(v-model="form.priority" class="w-full")
            el-option(:label="$t('common.low')" value="low")
            el-option(:label="$t('common.medium')" value="medium")
            el-option(:label="$t('common.high')" value="high")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('kanbanBoard.assignee')")
          el-input(v-model="form.assignee" :placeholder="$t('kanbanBoard.assigneePlaceholder')")
        el-form-item(:label="$t('kanbanBoard.value')")
          el-input-number(v-model="form.value" :min="0" class="!w-full")
    template(#footer)
      el-button(@click="showDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="saveCard" :loading="saving" style="border-radius: 12px;") {{ $t('kanbanBoard.addItem') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import logger from '~/utils/logger';
import {
  fetchDealKanban,
  fetchOpportunityKanban,
  updateDealStage,
  updateOpportunityStage,
  getStageColor,
  getPriorityColor,
  type KanbanCard as ApiKanbanCard
} from '~/composables/useKanban';

definePageMeta({});

const { t: $t } = useI18n();

// ─── View mode toggle ───────────────────────────────────────────────────────
type ViewMode = 'deal' | 'opportunity';
const viewMode = ref<ViewMode>('deal');
const viewOptions = computed(() => [
  { label: $t('kanbanBoard.deals'), value: 'deal' },
  { label: $t('kanbanBoard.opportunities'), value: 'opportunity' }
]);

// ─── Column definitions per view mode ───────────────────────────────────────
const dealStages = [
  { id: 'PROGRESS', title: 'In Progress', color: '#3B82F6' },
  { id: 'NEGOTIATION', title: 'Negotiation', color: '#8B5CF6' },
  { id: 'CLOSED', title: 'Closed', color: '#22c55e' },
  { id: 'CANCELLED', title: 'Cancelled', color: '#EF4444' },
  { id: 'ARCHIVED', title: 'Archived', color: '#6B7280' }
];

const opportunityStages = [
  { id: 'DISCOVERY', title: 'Discovery', color: '#8B5CF6' },
  { id: 'PROPOSAL', title: 'Proposal', color: '#F59E0B' },
  { id: 'NEGOTIATION', title: 'Negotiation', color: '#3B82F6' },
  { id: 'WON', title: 'Won', color: '#10B981' },
  { id: 'LOST', title: 'Lost', color: '#EF4444' }
];

const columns = computed(() => (viewMode.value === 'deal' ? dealStages : opportunityStages));

// ─── Internal card type ─────────────────────────────────────────────────────
interface KanbanCard {
  id: string;
  ref: string;
  title: string;
  description: string;
  columnId: string;
  priority: string;
  assignee: string;
  value: number;
}

const cards = ref<KanbanCard[]>([]);
const showDialog = ref(false);
const loading = ref(false);
const saving = ref(false);
const form = reactive({ title: '', description: '', columnId: 'PROGRESS', priority: 'medium', assignee: '', value: 0 });
let draggedCard: KanbanCard | null = null;

// Advanced filters
const filters = reactive({
  assignee: '',
  dateRange: null as [string, string] | null,
  priority: ''
});

const assignees = ref<Record<string, unknown>[]>([]);

function getColumnCards(colId: string) {
  let filtered = cards.value.filter(c => c.columnId === colId);

  // Apply filters
  if (filters.assignee) {
    filtered = filtered.filter(c => c.assignee === filters.assignee);
  }
  if (filters.priority) {
    filtered = filtered.filter(c => c.priority === filters.priority);
  }
  // Date range filter would need additional date field in card model

  return filtered;
}

// ─── Map API response to internal card format ───────────────────────────────
function mapDealCards(data: Record<string, ApiKanbanCard[]>): KanbanCard[] {
  const result: KanbanCard[] = [];
  for (const [stage, items] of Object.entries(data)) {
    for (const item of items) {
      result.push({
        id: String(item.id),
        ref: `DEAL-${String(item.id).slice(-4).padStart(4, '0')}`,
        title: item.name || '',
        description: item.companyName || '',
        columnId: stage,
        priority: (item.contractType || '').toLowerCase(),
        assignee: item.users?.[0]?.name || '',
        value: item.price || 0
      });
    }
  }
  return result;
}

function mapOpportunityCards(data: Record<string, ApiKanbanCard[]>): KanbanCard[] {
  const result: KanbanCard[] = [];
  for (const [stage, items] of Object.entries(data)) {
    for (const item of items) {
      result.push({
        id: String(item.id),
        ref: `OPP-${String(item.id).slice(-4).padStart(4, '0')}`,
        title: item.name || '',
        description: item.lead?.companyName || item.lead?.name || '',
        columnId: stage,
        priority: (item.priority || '').toLowerCase(),
        assignee: item.users?.[0]?.name || '',
        value: item.estimatedValue || 0
      });
    }
  }
  return result;
}

// ─── Fetch data from real API ───────────────────────────────────────────────
async function fetchData() {
  loading.value = true;
  try {
    if (viewMode.value === 'deal') {
      const data = await fetchDealKanban();
      cards.value = mapDealCards(data);
    } else {
      const data = await fetchOpportunityKanban();
      cards.value = mapOpportunityCards(data);
    }
  } catch (e) {
    logger.error('Failed to fetch kanban data:', e);
    ElMessage.error($t('kanbanBoard.loadError'));
  } finally {
    loading.value = false;
  }
}

// Fetch assignees for filter
async function fetchAssignees() {
  try {
    const res = await useApiFetch('users');
    if (res?.success && res?.body?.docs) {
      assignees.value = res.body.docs.map(u => ({ label: u.name, value: u.name }));
    }
  } catch (e: unknown) {
    ElMessage.error($t('common.error'));
  }
}

function onViewChange() {
  // Reset form default column based on view mode
  form.columnId = viewMode.value === 'deal' ? 'PROGRESS' : 'DISCOVERY';
  fetchData();
}

// ─── Add card (deal only for now) ───────────────────────────────────────────
function addCard() {
  form.columnId = columns.value[0]?.id || 'PROGRESS';
  showDialog.value = true;
}

async function saveCard() {
  if (!form.title.trim()) return;
  saving.value = true;
  try {
    // Create a deal via the deal API
    const payload: Record<string, unknown> = {
      name: form.title,
      companyName: form.description,
      stage: form.columnId,
      price: form.value
    };
    const { body, success } = await useApiFetch('deal/create', 'POST', payload);
    if (success && body) {
      // Refresh from API to get accurate data
      await fetchData();
      ElMessage.success($t('kanbanBoard.cardAdded'));
    } else {
      ElMessage.error($t('common.error'));
    }
    Object.assign(form, { title: '', description: '', columnId: columns.value[0]?.id || 'PROGRESS', priority: 'medium', assignee: '', value: 0 });
    showDialog.value = false;
  } catch (e) {
    logger.error('Failed to save card:', e);
    ElMessage.error($t('common.error'));
  } finally {
    saving.value = false;
  }
}

// ─── Move card (calls real stage-update API) ────────────────────────────────
async function moveCard(cardId: string, targetCol: string) {
  const card = cards.value.find(c => c.id === cardId);
  if (!card) return;

  const previousCol = card.columnId;
  // Optimistic UI update
  card.columnId = targetCol;

  let ok = false;
  try {
    if (viewMode.value === 'deal') {
      ok = await updateDealStage(cardId, targetCol);
    } else {
      ok = await updateOpportunityStage(cardId, targetCol);
    }
    if (ok) {
      ElMessage.success($t('kanbanBoard.cardMoved'));
    } else {
      // Revert on failure
      card.columnId = previousCol;
    }
  } catch (e) {
    card.columnId = previousCol;
    logger.error('Failed to move card:', e);
    ElMessage.error($t('kanbanBoard.moveError'));
  }
}

// ─── Drag and drop ──────────────────────────────────────────────────────────
function dragStart(card: KanbanCard) {
  draggedCard = card;
}
function dragEnd() {
  draggedCard = null;
}
function dropCard(colId: string) {
  if (draggedCard) {
    moveCard(draggedCard.id, colId);
    draggedCard = null;
  }
}

function priorityTag(p: string): '' | 'success' | 'warning' | 'danger' {
  const lower = (p || '').toLowerCase();
  return (
    { low: 'success' as const, medium: 'warning' as const, high: 'danger' as const, very_high: 'danger' as const, very_low: 'success' as const }[
      lower
    ] || ''
  );
}

onMounted(() => {
  fetchData();
  fetchAssignees();
});
</script>
