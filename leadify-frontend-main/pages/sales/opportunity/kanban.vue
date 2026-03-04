<template lang="pug">
div
  .flex.items-center.justify-between.mb-8
    .title.font-bold.text-2xl.mb-1.capitalize {{ $t('opportunities.title') }} - {{ $t('kanban.view') }}
    .flex.items-center.gap-x-3
      el-button-group
        el-button(:type="'default'" size="large" @click="navigateTo('/sales/opportunity')" class="!rounded-l-2xl")
          Icon(name="ph:list-bold" size="18")
          span.ml-1 {{ $t('kanban.tableView') }}
        el-button(type="primary" size="large" class="!rounded-r-2xl")
          Icon(name="ph:columns-bold" size="18")
          span.ml-1 {{ $t('kanban.kanbanView') }}
      NuxtLink(to="/sales/opportunity/add-opportunity" v-if="hasPermission('CREATE_OPPORTUNITIES')")
        el-button(size='large' type="primary" :icon="Plus" class="!rounded-2xl") {{ $t('opportunities.newOpp') }}

  //- Pipeline value summary
  .grid.gap-4.mb-6(:class="columns.length <= 5 ? 'grid-cols-' + columns.length : 'grid-cols-5'" v-if="columns.length")
    .glass-card.rounded-2xl.p-4.text-center(v-for="col in columns" :key="col.key")
      .text-xs.font-medium.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ col.label }}
      .text-xl.font-bold(:style="{ color: col.color }") {{ formatCurrency(col.totalValue) }}
      .text-xs.mt-1(style="color: var(--text-muted)") {{ (kanbanCards[col.key] || []).length }} opps

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
import { fetchOpportunityKanban, updateOpportunityStage, getStageColor } from '@/composables/useKanban';
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

const columns = computed(() => {
  // Use pipeline stages if configured for opportunity, otherwise fallback to enum stages
  const fallback = [
    { key: 'DISCOVERY', label: t('kanban.stages.discovery'), color: getStageColor('DISCOVERY'), totalValue: sumValue('DISCOVERY') },
    { key: 'PROPOSAL', label: t('kanban.stages.proposal'), color: getStageColor('PROPOSAL'), totalValue: sumValue('PROPOSAL') },
    { key: 'NEGOTIATION', label: t('kanban.stages.negotiation'), color: getStageColor('NEGOTIATION'), totalValue: sumValue('NEGOTIATION') },
    { key: 'WON', label: t('kanban.stages.won'), color: getStageColor('WON'), totalValue: sumValue('WON') },
    { key: 'LOST', label: t('kanban.stages.lost'), color: getStageColor('LOST'), totalValue: sumValue('LOST') }
  ];

  if (pipelineStages.value.length > 0) {
    return pipelineStages.value.map(stage => ({
      key: stage.name,
      label: stage.name,
      color: stage.color,
      totalValue: sumValue(stage.name)
    }));
  }
  return fallback;
});

function sumValue(stage: string): number {
  return (kanbanCards.value[stage] || []).reduce((sum, card) => sum + (card.estimatedValue || 0), 0);
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
  const [stages, cards] = await Promise.all([fetchPipelineStages('opportunity'), fetchOpportunityKanban()]);
  pipelineStages.value = stages;
  kanbanCards.value = cards;
  loading.value = false;
}

async function onStageChange(payload: { cardId: string; fromStage: string; toStage: string }) {
  const ok = await updateOpportunityStage(payload.cardId, payload.toStage);
  if (!ok) {
    await loadKanban();
  } else {
    ElNotification({ type: 'success', title: t('common.success'), message: t('kanban.stageUpdated') });
  }
}

function onCardClick(card: KanbanCard) {
  router.push(`/sales/opportunity/${card.id}`);
}

onMounted(loadKanban);
</script>
