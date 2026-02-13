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

  div(v-loading="loading")
    KanbanBoard(
      :columns="columns"
      :cards="kanbanCards"
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

const columns = computed(() => [
  { key: 'PROGRESS', label: t('kanban.stages.progress'), color: getStageColor('PROGRESS'), totalValue: sumValue('PROGRESS') },
  { key: 'CLOSED', label: t('kanban.stages.closed'), color: getStageColor('CLOSED'), totalValue: sumValue('CLOSED') },
  { key: 'CANCELLED', label: t('kanban.stages.cancelled'), color: getStageColor('CANCELLED'), totalValue: sumValue('CANCELLED') }
]);

function sumValue(stage: string): number {
  return (kanbanCards.value[stage] || []).reduce((sum, card) => sum + (card.price || 0), 0);
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
