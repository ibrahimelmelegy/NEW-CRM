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
import { fetchDealKanban, updateDealStage, getStageColor } from '@/composables/useKanban';
import type { KanbanCard } from '@/composables/useKanban';

const router = useRouter();
const { hasPermission } = await usePermissions();
const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(true);
const kanbanCards = ref<Record<string, KanbanCard[]>>({});
const swimlaneMode = ref<'none' | 'assignee' | 'priority' | 'value'>('none');
const activeFilter = ref('all');
const kanbanBoardRef = ref<{ toggleAllLanes: () => void } | null>(null);

const columns = computed(() => [
  { key: 'PROGRESS', label: t('kanban.stages.progress'), color: getStageColor('PROGRESS'), totalValue: sumValue('PROGRESS') },
  { key: 'CLOSED', label: t('kanban.stages.closed'), color: getStageColor('CLOSED'), totalValue: sumValue('CLOSED') },
  { key: 'CANCELLED', label: t('kanban.stages.cancelled'), color: getStageColor('CANCELLED'), totalValue: sumValue('CANCELLED') }
]);

function sumValue(stage: string): number {
  return (kanbanCards.value[stage] || []).reduce((sum, card) => sum + (card.price || 0), 0);
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
  kanbanCards.value = await fetchDealKanban();
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
