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
import { fetchOpportunityKanban, updateOpportunityStage, getStageColor } from '@/composables/useKanban';
import type { KanbanCard } from '@/composables/useKanban';

const router = useRouter();
const { hasPermission } = await usePermissions();
const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(true);
const kanbanCards = ref<Record<string, KanbanCard[]>>({});

const columns = computed(() => [
  { key: 'DISCOVERY', label: t('kanban.stages.discovery'), color: getStageColor('DISCOVERY'), totalValue: sumValue('DISCOVERY') },
  { key: 'PROPOSAL', label: t('kanban.stages.proposal'), color: getStageColor('PROPOSAL'), totalValue: sumValue('PROPOSAL') },
  { key: 'NEGOTIATION', label: t('kanban.stages.negotiation'), color: getStageColor('NEGOTIATION'), totalValue: sumValue('NEGOTIATION') },
  { key: 'WON', label: t('kanban.stages.won'), color: getStageColor('WON'), totalValue: sumValue('WON') },
  { key: 'LOST', label: t('kanban.stages.lost'), color: getStageColor('LOST'), totalValue: sumValue('LOST') }
]);

function sumValue(stage: string): number {
  return (kanbanCards.value[stage] || []).reduce((sum, card) => sum + (card.estimatedValue || 0), 0);
}

async function loadKanban() {
  loading.value = true;
  kanbanCards.value = await fetchOpportunityKanban();
  loading.value = false;
}

async function onStageChange(payload: { cardId: string; fromStage: string; toStage: string }) {
  const ok = await updateOpportunityStage(payload.cardId, payload.toStage);
  if (!ok) {
    await loadKanban();
  } else {
    ElNotification({ type: 'success', title: 'Success', message: t('kanban.stageUpdated') });
  }
}

function onCardClick(card: KanbanCard) {
  router.push(`/sales/opportunity/${card.id}`);
}

onMounted(loadKanban);
</script>
