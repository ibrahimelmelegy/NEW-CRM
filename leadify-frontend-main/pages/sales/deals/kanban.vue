<template lang="pug">
div
  .flex.items-center.justify-between.mb-8
    .title.font-bold.text-2xl.mb-1.capitalize {{ $t('deals.title') }} - {{ $t('kanban.view') }}
    .flex.items-center.gap-x-3
      el-button-group
        el-button(:type="'default'" size="large" @click="navigateTo('/sales/deals')" class="!rounded-l-2xl")
          Icon(name="ph:list-bold" size="18")
          span.ml-1 {{ $t('kanban.tableView') }}
        el-button(type="primary" size="large" class="!rounded-r-2xl")
          Icon(name="ph:columns-bold" size="18")
          span.ml-1 {{ $t('kanban.kanbanView') }}
      NuxtLink(to="/sales/deals/add-deal" v-if="hasPermission('CREATE_DEALS')")
        el-button(size='large' type="primary" :icon="Plus" class="!rounded-2xl") {{ $t('deals.newDeal') }}

  //- Pipeline value summary
  .grid.gap-4.mb-6(:class="pipelineStages.length <= 4 ? 'grid-cols-' + pipelineStages.length : 'grid-cols-4'" v-if="pipelineStages.length")
    .glass-card.rounded-2xl.p-4.text-center(v-for="stage in pipelineStages" :key="stage.id")
      .text-xs.font-medium.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ stage.name }}
      .text-xl.font-bold(:style="{ color: stage.color }") {{ formatCurrency(sumValue(stage.name)) }}
      .text-xs.mt-1(style="color: var(--text-muted)") {{ (kanbanCards[stage.name] || []).length }} {{ $t('deals.title').toLowerCase() }}

  //- Kanban Toolbar
  KanbanToolbar(
    :swimlane-mode="swimlaneMode"
    :total-cards="totalCards"
    :active-filter="activeFilter"
    @update:swimlane-mode="swimlaneMode = $event"
    @filter="onFilter"
    @toggle-all="onToggleAll"
  )

  div(v-loading="loading")
    KanbanBoardAdvanced(
      ref="kanbanBoardRef"
      :columns="columns"
      :cards="filteredCards"
      :swimlane-mode="swimlaneMode"
      @stageChange="onStageChange"
      @cardClick="onCardClick"
    )
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
import { ElNotification } from 'element-plus';
import { fetchDealKanban, updateDealStage } from '@/composables/useKanban';
import { fetchPipelineStages } from '@/composables/usePipelineConfig';
import type { KanbanCard } from '@/composables/useKanban';
import type { PipelineStage } from '@/composables/usePipelineConfig';

const router = useRouter();
const { hasPermission } = await usePermissions();
const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(true);
const kanbanCards = ref<Record<string, KanbanCard[]>>({});
const pipelineStages = ref<PipelineStage[]>([]);
const swimlaneMode = ref<'none' | 'assignee' | 'priority' | 'value'>('none');
const activeFilter = ref('all');
const kanbanBoardRef = ref<{ toggleAllLanes: () => void } | null>(null);

// Fallback stages when pipeline config is empty
const fallbackStages = [
  { key: 'PROGRESS', label: t('kanban.stages.progress'), color: '#3B82F6' },
  { key: 'CLOSED', label: t('kanban.stages.closed'), color: '#10B981' },
  { key: 'CANCELLED', label: t('kanban.stages.cancelled'), color: '#EF4444' }
];

const columns = computed(() => {
  if (pipelineStages.value.length > 0) {
    return pipelineStages.value.map(stage => ({
      key: stage.name,
      label: stage.name,
      color: stage.color,
      totalValue: sumValue(stage.name)
    }));
  }
  return fallbackStages.map(s => ({ ...s, totalValue: sumValue(s.key) }));
});

function sumValue(stage: string): number {
  return (kanbanCards.value[stage] || []).reduce((sum, card) => sum + (card.price || 0), 0);
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M SAR`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K SAR`;
  return `${value} SAR`;
}

// Total card count across all stages
const totalCards = computed(() => {
  return Object.values(kanbanCards.value).reduce((sum, cards) => sum + cards.length, 0);
});

// Filtered cards based on active quick filter
const filteredCards = computed<Record<string, KanbanCard[]>>(() => {
  if (activeFilter.value === 'all') return kanbanCards.value;

  const result: Record<string, KanbanCard[]> = {};
  const now = new Date();

  for (const [stage, cards] of Object.entries(kanbanCards.value)) {
    result[stage] = cards.filter(card => {
      if (activeFilter.value === 'high-value') {
        const val = card.price ?? card.estimatedValue ?? 0;
        return val > 10000;
      }
      if (activeFilter.value === 'stale') {
        const dateStr = card.updatedAt || card.createdAt;
        if (!dateStr) return false;
        const diffDays = (now.getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
        return diffDays > 7;
      }
      if (activeFilter.value === 'closing-soon') {
        if (!card.expectedCloseDate) return false;
        const closeDate = new Date(card.expectedCloseDate);
        const diffDays = (closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 14;
      }
      return true;
    });
  }
  return result;
});

function onFilter(key: string) {
  activeFilter.value = activeFilter.value === key ? 'all' : key;
}

function onToggleAll() {
  kanbanBoardRef.value?.toggleAllLanes();
}

async function loadKanban() {
  loading.value = true;
  const [stages, cards] = await Promise.all([
    fetchPipelineStages('deal'),
    fetchDealKanban()
  ]);
  pipelineStages.value = stages;
  kanbanCards.value = cards;
  loading.value = false;
}

async function onStageChange(payload: { cardId: string; fromStage: string; toStage: string }) {
  const ok = await updateDealStage(payload.cardId, payload.toStage);
  if (!ok) {
    // Revert on failure
    await loadKanban();
  } else {
    ElNotification({ type: 'success', title: 'Success', message: t('kanban.stageUpdated') });
  }
}

function onCardClick(card: KanbanCard) {
  router.push(`/sales/deals/${card.id}`);
}

onMounted(loadKanban);
</script>
